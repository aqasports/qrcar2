import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/actions/[id] - Fetch service action detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    // 1. Fetch action with vehicle and client details
    const actionRows = await sql(`
      SELECT a.*, v.plate_number, v.make, v.model, v.year, v.fuel_type, v.engine_spec,
             COALESCE(c.full_name, 'Non assigné / Stock') as client_name, c.phone as client_phone
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE a.id = $1
      LIMIT 1
    `, [actionId]);

    if (actionRows.length === 0) {
      return NextResponse.json({ error: 'Action introuvable' }, { status: 404 });
    }

    const action = actionRows[0];

    // 2. Fetch assigned workers
    const workers = await sql(`
      SELECT aw.id as assignment_id, aw.worker_id, aw.role_on_job, aw.hours_spent, w.full_name, w.role as worker_role
      FROM action_workers aw
      JOIN workers w ON aw.worker_id = w.id
      WHERE aw.action_id = $1
    `, [actionId]);

    // 3. Fetch parts used in this action
    let partsUsed = [];
    if (role === 'technician') {
      partsUsed = await sql(`
        SELECT ap.id as item_id, ap.part_id, ap.quantity, p.name, p.sku, p.unit
        FROM action_parts ap
        JOIN parts p ON ap.part_id = p.id
        WHERE ap.action_id = $1
      `, [actionId]);
    } else {
      partsUsed = await sql(`
        SELECT ap.id as item_id, ap.part_id, ap.quantity, ap.unit_price_snapshot, p.name, p.sku, p.unit
        FROM action_parts ap
        JOIN parts p ON ap.part_id = p.id
        WHERE ap.action_id = $1
      `, [actionId]);
    }

    // 4. Role validations for technician
    if (role === 'technician') {
      const userWorkerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      if (userWorkerRows.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const workerId = userWorkerRows[0].id;
      const assigned = workers.some((w: any) => w.worker_id === workerId);
      if (!assigned) {
        return NextResponse.json({ error: 'Accès interdit. Vous n\'êtes pas assigné à cette intervention.' }, { status: 403 });
      }

      delete action.labor_cost;
      delete action.internal_notes;
      delete action.client_phone;
    }

    // Fetch associated invoice
    const invoiceRows = await sql(`SELECT id, invoice_number, total, status FROM invoices WHERE action_id = $1 LIMIT 1`, [actionId]);
    const invoice = invoiceRows.length > 0 ? invoiceRows[0] : null;

    return NextResponse.json({ action, workers, parts: partsUsed, invoice });
  } catch (error) {
    console.error('Failed to get action detail:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/actions/[id] - Update service action parameters (Everything editable)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    const body = await req.json();
    const {
      type,
      description,
      client_visible_notes,
      internal_notes,
      mileage_at_service,
      status,
      labor_cost,
      date_in,
      date_out,
      vehicle_id,
      workers // Array<{ worker_id: string, role_on_job: string, hours_spent?: number }>
    } = body;

    // Check action exists
    const actionCheck = await sql(`SELECT * FROM actions WHERE id = $1 LIMIT 1`, [actionId]);
    if (actionCheck.length === 0) {
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }
    const oldAction = actionCheck[0];

    // Technician security constraints
    if (role === 'technician') {
      const userWorkerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      if (userWorkerRows.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const workerId = userWorkerRows[0].id;

      const assignCheck = await sql(`
        SELECT 1 FROM action_workers 
        WHERE action_id = $1 AND worker_id = $2 
        LIMIT 1
      `, [actionId, workerId]);

      if (assignCheck.length === 0) {
        return NextResponse.json({ error: 'Accès interdit. Vous n\'êtes pas assigné à cette intervention.' }, { status: 403 });
      }

      if (labor_cost !== undefined || internal_notes !== undefined || workers !== undefined) {
        return NextResponse.json({ error: 'Seuls les responsables peuvent modifier les coûts et l\'affectation du personnel.' }, { status: 403 });
      }
    }

    const updatedType = type || oldAction.type;
    const updatedDescription = description !== undefined ? description : oldAction.description;
    const updatedClientNotes = client_visible_notes !== undefined ? client_visible_notes : oldAction.client_visible_notes;
    const updatedInternalNotes = internal_notes !== undefined ? internal_notes : oldAction.internal_notes;
    const updatedMileage = mileage_at_service !== undefined ? parseInt(mileage_at_service, 10) : oldAction.mileage_at_service;
    const updatedStatus = status || oldAction.status;
    const updatedLabor = labor_cost !== undefined ? parseFloat(labor_cost) : oldAction.labor_cost;
    const updatedDateIn = date_in || oldAction.date_in;
    const updatedVehicleId = vehicle_id || oldAction.vehicle_id;

    let updatedDateOut = date_out !== undefined ? date_out : oldAction.date_out;
    if (updatedStatus === 'completed' && !updatedDateOut) {
      updatedDateOut = new Date().toISOString();
    }

    // Update main action fields
    const updatedActionRows = await sql(`
      UPDATE actions
      SET type = $1,
          description = $2,
          client_visible_notes = $3,
          internal_notes = $4,
          mileage_at_service = $5,
          status = $6,
          labor_cost = $7,
          date_in = $8,
          date_out = $9,
          vehicle_id = $10,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      updatedType,
      updatedDescription,
      updatedClientNotes,
      updatedInternalNotes,
      updatedMileage,
      updatedStatus,
      updatedLabor,
      updatedDateIn,
      updatedDateOut,
      updatedVehicleId,
      actionId
    ]);

    const updatedAction = updatedActionRows[0];

    // Update worker assignments if provided (Allowed for manager/admin)
    if (workers !== undefined && Array.isArray(workers) && role !== 'technician') {
      await sql(`DELETE FROM action_workers WHERE action_id = $1`, [actionId]);
      for (const w of workers) {
        if (w.worker_id) {
          await sql(`
            INSERT INTO action_workers (action_id, worker_id, role_on_job, hours_spent)
            VALUES ($1, $2, $3, $4)
          `, [actionId, w.worker_id, w.role_on_job || 'lead', parseFloat(w.hours_spent) || 0.0]);
        }
      }
    }

    // Update vehicle odometer if mileage increased
    if (updatedMileage > 0) {
      const vRows = await sql(`SELECT current_mileage FROM vehicles WHERE id = $1`, [updatedVehicleId]);
      if (vRows.length > 0 && updatedMileage > vRows[0].current_mileage) {
        await sql(`UPDATE vehicles SET current_mileage = $1 WHERE id = $2`, [updatedMileage, updatedVehicleId]);
      }
    }

    // Log audit
    await logAudit({
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'update',
      metadata: {
        old_status: oldAction.status,
        new_status: updatedStatus,
        changes: {
          type: updatedType !== oldAction.type ? updatedType : undefined,
          status: updatedStatus !== oldAction.status ? updatedStatus : undefined,
          mileage: updatedMileage !== oldAction.mileage_at_service ? updatedMileage : undefined,
        }
      }
    });

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error('Failed to update action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/actions/[id] - Delete action (Allowed for super_admin & manager)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Check if an issued or paid invoice is attached
    const invoiceRows = await sql(`SELECT id, status FROM invoices WHERE action_id = $1 AND status IN ('issued', 'paid')`, [actionId]);
    if (invoiceRows.length > 0) {
      return NextResponse.json({ error: 'Impossible de supprimer une intervention dont la facture a déjà été émise ou payée.' }, { status: 400 });
    }

    // 2. Atomically restore parts stock if parts were consumed
    const actionParts = await sql(`SELECT part_id, quantity FROM action_parts WHERE action_id = $1`, [actionId]);
    for (const ap of actionParts) {
      await sql(`UPDATE parts SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2`, [ap.quantity, ap.part_id]);
      await sql(`
        INSERT INTO stock_movements (part_id, action_id, type, quantity, reason, created_by)
        VALUES ($1, $2, 'adjustment', $3, 'Annulation suppression intervention', $4)
      `, [ap.part_id, actionId, ap.quantity, userId]);
    }

    // 3. Delete action parts, workers, draft invoices, and the action itself
    await sql(`DELETE FROM action_parts WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM action_workers WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM invoices WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM actions WHERE id = $1`, [actionId]);

    // 4. Log audit
    await logAudit({
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'delete',
      metadata: { deleted_by: userId }
    });

    return NextResponse.json({ message: 'Intervention supprimée avec succès et stock réajusté.' });
  } catch (error) {
    console.error('Failed to delete action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
