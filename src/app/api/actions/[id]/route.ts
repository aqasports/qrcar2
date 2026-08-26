import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from '@/lib/api/response';
import crypto from 'crypto';

// GET /api/actions/[id] - Fetch service action detail scoped to organization
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;

  try {
    // 1. Fetch action with vehicle, client, and template details within organization
    const actionRows = await sql(
      `
      SELECT 
        a.*, 
        v.plate_number, v.make, v.model, v.year, v.fuel_type, v.engine_spec, v.vin, v.oil_type, v.tire_size,
        COALESCE(c.full_name, 'Non assigné / Stock') as client_name, c.phone as client_phone, c.email as client_email,
        rot.name as template_name, rot.category as template_category
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $2
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN repair_order_templates rot ON rot.id = a.template_id
      WHERE a.id = $1 AND a.organization_id = $2
      LIMIT 1
    `,
      [actionId, organizationId]
    );

    if (actionRows.length === 0) {
      return apiNotFound('Ordre de réparation introuvable.');
    }

    const action = actionRows[0];

    // 2. Fetch assigned workers
    const workers = await sql(
      `
      SELECT aw.action_id, aw.worker_id, aw.role_on_job, aw.hours_spent, w.full_name, w.role as worker_role
      FROM action_workers aw
      JOIN workers w ON aw.worker_id = w.id AND w.organization_id = $2
      WHERE aw.action_id = $1
    `,
      [actionId, organizationId]
    );

    // 3. Fetch Repair Order Items (custom acts, services, parts)
    let roItems = await sql(
      `
      SELECT 
        roi.*,
        p.name as linked_part_name,
        p.sku as linked_part_sku,
        p.quantity_in_stock as linked_part_stock
      FROM repair_order_items roi
      LEFT JOIN parts p ON p.id = roi.linked_part_id
      WHERE roi.action_id = $1
      ORDER BY roi.sort_order ASC, roi.created_at ASC
    `,
      [actionId]
    );

    // If no repair_order_items exist (legacy action), fallback to action_parts
    if (roItems.length === 0) {
      const legacyParts = await sql(
        `
        SELECT 
          ap.part_id, ap.quantity, ap.unit_price_snapshot,
          p.name, p.sku, p.unit, p.quantity_in_stock as linked_part_stock
        FROM action_parts ap
        JOIN parts p ON ap.part_id = p.id AND p.organization_id = $2
        WHERE ap.action_id = $1
      `,
        [actionId, organizationId]
      );

      roItems = legacyParts.map((lp: any, idx: number) => ({
        id: `legacy-${lp.part_id}`,
        action_id: actionId,
        name: lp.name,
        description: `Réf: ${lp.sku}`,
        item_type: 'part',
        quantity: parseFloat(lp.quantity || '1'),
        unit_price: parseFloat(lp.unit_price_snapshot || '0'),
        unit: lp.unit || 'u',
        linked_part_id: lp.part_id,
        unit_price_snapshot: parseFloat(lp.unit_price_snapshot || '0'),
        linked_part_name: lp.name,
        linked_part_sku: lp.sku,
        linked_part_stock: lp.linked_part_stock,
        sort_order: idx,
      }));
    } else {
      roItems = roItems.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity || '1'),
        unit_price: parseFloat(item.unit_price || '0'),
        unit_price_snapshot: item.unit_price_snapshot ? parseFloat(item.unit_price_snapshot) : null,
      }));
    }

    // 4. Role validations for technician
    if (role === 'technician') {
      const userWorkerRows = await sql(
        `SELECT id FROM workers WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
        [userId, organizationId]
      );
      if (userWorkerRows.length === 0) {
        return apiError('Forbidden', 'FORBIDDEN', 403);
      }
      const workerId = userWorkerRows[0].id;
      const assigned = workers.some((w: any) => w.worker_id === workerId);
      if (!assigned) {
        return apiError('Accès interdit. Vous n\'êtes pas assigné à cette intervention.', 'FORBIDDEN', 403);
      }

      delete action.labor_cost;
      delete action.internal_notes;
      delete action.client_phone;
      delete action.client_email;
    }

    // 5. Fetch associated invoice
    const invoiceRows = await sql(
      `SELECT id, invoice_number, subtotal, tax_amount, total, status, pdf_path FROM invoices WHERE action_id = $1 AND organization_id = $2 LIMIT 1`,
      [actionId, organizationId]
    );
    const invoice = invoiceRows.length > 0 ? invoiceRows[0] : null;

    const formattedAction = {
      ...action,
      labor_cost: parseFloat(action.labor_cost || '0'),
      has_tax: action.has_tax !== false && action.has_tax !== 0,
      tax_rate: parseFloat(action.tax_rate || '19.00'),
      quality_checkpoints: typeof action.quality_checkpoints === 'string' ? JSON.parse(action.quality_checkpoints) : (action.quality_checkpoints || []),
    };

    return apiSuccess({
      action: formattedAction,
      workers,
      items: roItems,
      parts: roItems.filter((i: any) => i.item_type === 'part' || i.linked_part_id),
      invoice,
    });
  } catch (error) {
    console.error('Failed to get action detail:', error);
    return apiServerError();
  }
}

// PATCH /api/actions/[id] - Update service action parameters scoped to organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;

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
      has_tax,
      tax_rate,
      template_id,
      quality_checkpoints,
      date_in,
      date_out,
      vehicle_id,
      workers, // Array<{ worker_id: string, role_on_job: string, hours_spent: number }>
      items,   // Array<{ id?: string, name: string, description?: string, item_type: string, quantity: number, unit_price: number, unit?: string, linked_part_id?: string }>
    } = body;

    // Check action exists in this org
    const actionCheck = await sql(
      `SELECT * FROM actions WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [actionId, organizationId]
    );
    if (actionCheck.length === 0) {
      return apiNotFound('Ordre de réparation introuvable.');
    }
    const oldAction = actionCheck[0];

    // Technician security constraints
    if (role === 'technician') {
      const userWorkerRows = await sql(
        `SELECT id FROM workers WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
        [userId, organizationId]
      );
      if (userWorkerRows.length === 0) {
        return apiError('Forbidden', 'FORBIDDEN', 403);
      }
      const workerId = userWorkerRows[0].id;

      const assignCheck = await sql(
        `SELECT 1 FROM action_workers WHERE action_id = $1 AND worker_id = $2 LIMIT 1`,
        [actionId, workerId]
      );

      if (assignCheck.length === 0) {
        return apiError('Accès interdit. Vous n\'êtes pas assigné à cet ordre de réparation.', 'FORBIDDEN', 403);
      }

      if (labor_cost !== undefined || internal_notes !== undefined || workers !== undefined || has_tax !== undefined || items !== undefined) {
        return apiError('Seuls les responsables peuvent modifier les prix, taxes et l\'affectation du personnel.', 'FORBIDDEN', 403);
      }
    }

    const updatedType = type || oldAction.type;
    const updatedDescription = description !== undefined ? description : oldAction.description;
    const updatedClientNotes = client_visible_notes !== undefined ? client_visible_notes : oldAction.client_visible_notes;
    const updatedInternalNotes = internal_notes !== undefined ? internal_notes : oldAction.internal_notes;
    const updatedMileage = mileage_at_service !== undefined ? parseInt(String(mileage_at_service), 10) : oldAction.mileage_at_service;
    const updatedStatus = status || oldAction.status;
    const updatedLabor = labor_cost !== undefined ? parseFloat(String(labor_cost)) : parseFloat(oldAction.labor_cost || '0');
    const updatedHasTax = has_tax !== undefined ? (has_tax ? 1 : 0) : oldAction.has_tax;
    const updatedTaxRate = tax_rate !== undefined ? parseFloat(String(tax_rate)) : parseFloat(oldAction.tax_rate || '19.00');
    const updatedTemplateId = template_id !== undefined ? (template_id || null) : oldAction.template_id;
    const updatedCheckpoints = quality_checkpoints !== undefined ? JSON.stringify(quality_checkpoints) : oldAction.quality_checkpoints;
    const updatedDateIn = date_in || oldAction.date_in;
    const updatedVehicleId = vehicle_id || oldAction.vehicle_id;

    let updatedDateOut = date_out !== undefined ? date_out : oldAction.date_out;
    if (updatedStatus === 'completed' && !updatedDateOut) {
      updatedDateOut = new Date().toISOString();
    }

    // 1. Update main action record
    const updatedActionRows = await sql(
      `
      UPDATE actions
      SET type = $1,
          description = $2,
          client_visible_notes = $3,
          internal_notes = $4,
          mileage_at_service = $5,
          status = $6,
          labor_cost = $7,
          has_tax = $8,
          tax_rate = $9,
          template_id = $10,
          quality_checkpoints = $11,
          date_in = $12,
          date_out = $13,
          vehicle_id = $14,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND organization_id = $16
      RETURNING *
    `,
      [
        updatedType,
        updatedDescription,
        updatedClientNotes,
        updatedInternalNotes,
        updatedMileage,
        updatedStatus,
        updatedLabor,
        updatedHasTax,
        updatedTaxRate,
        updatedTemplateId,
        updatedCheckpoints,
        updatedDateIn,
        updatedDateOut,
        updatedVehicleId,
        actionId,
        organizationId,
      ]
    );

    const updatedAction = updatedActionRows[0];

    // 2. If line items provided, replace or sync them atomically
    if (items !== undefined && Array.isArray(items) && role !== 'technician') {
      await sql(`DELETE FROM repair_order_items WHERE action_id = $1`, [actionId]);

      for (let i = 0; i < items.length; i++) {
        const itm = items[i];
        const itemId = itm.id && !itm.id.startsWith('legacy-') && !itm.id.startsWith('temp-') ? itm.id : crypto.randomUUID();
        const qty = parseFloat(String(itm.quantity)) || 1;
        const price = parseFloat(String(itm.unit_price)) || 0;

        await sql(
          `
          INSERT INTO repair_order_items (
            id, action_id, name, description, item_type,
            quantity, unit_price, unit, linked_part_id,
            unit_price_snapshot, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
          [
            itemId,
            actionId,
            itm.name?.trim() || 'Prestation',
            itm.description?.trim() || null,
            itm.item_type || 'service',
            qty,
            price,
            itm.unit || 'u',
            itm.linked_part_id || null,
            itm.unit_price_snapshot ? parseFloat(String(itm.unit_price_snapshot)) : price,
            i,
          ]
        );
      }
    }

    // 3. Update worker assignments if provided
    if (workers !== undefined && Array.isArray(workers) && role !== 'technician') {
      await sql(`DELETE FROM action_workers WHERE action_id = $1`, [actionId]);
      for (const w of workers) {
        if (w.worker_id) {
          const workerValid = await sql(
            `SELECT id FROM workers WHERE id = $1 AND organization_id = $2 LIMIT 1`,
            [w.worker_id, organizationId]
          );
          if (workerValid.length > 0) {
            const awId = crypto.randomUUID();
            await sql(
              `
              INSERT INTO action_workers (id, action_id, worker_id, hours_spent, role_on_job)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT DO NOTHING
            `,
              [awId, actionId, w.worker_id, parseFloat(String(w.hours_spent)) || 0.0, w.role_on_job || 'lead']
            );
          }
        }
      }
    }

    // 4. Update vehicle odometer if mileage increased
    if (updatedMileage > 0) {
      const vRows = await sql(
        `SELECT current_mileage FROM vehicles WHERE id = $1 AND organization_id = $2`,
        [updatedVehicleId, organizationId]
      );
      if (vRows.length > 0 && updatedMileage > (vRows[0].current_mileage || 0)) {
        await sql(
          `UPDATE vehicles SET current_mileage = $1 WHERE id = $2 AND organization_id = $3`,
          [updatedMileage, updatedVehicleId, organizationId]
        );
      }
    }

    // 5. Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'update',
      metadata: {
        old_status: oldAction.status,
        new_status: updatedStatus,
        has_tax: updatedHasTax,
        tax_rate: updatedTaxRate,
      },
    });

    return apiSuccess(updatedAction);
  } catch (error) {
    console.error('Failed to update action:', error);
    return apiServerError();
  }
}

// DELETE /api/actions/[id] - Delete action (Allowed for owner, super_admin & manager)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  try {
    // 0. Verify the action belongs to this organization FIRST
    const ownerCheck = await sql(
      `SELECT id FROM actions WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [actionId, organizationId]
    );
    if (ownerCheck.length === 0) {
      return apiError('Ordre de réparation introuvable.', 'NOT_FOUND', 404);
    }

    // 1. Check if an issued or paid invoice is attached
    const invoiceRows = await sql(
      `SELECT id, status FROM invoices WHERE action_id = $1 AND organization_id = $2 AND status IN ('issued', 'paid')`,
      [actionId, organizationId]
    );
    if (invoiceRows.length > 0) {
      return apiError(
        'Impossible de supprimer un ordre de réparation dont la facture a déjà été émise ou payée.',
        'INVOICE_FROZEN',
        400
      );
    }

    // 2. Atomically restore parts stock from repair_order_items and action_parts (tenant-scoped)
    const actionParts = await sql(
      `
      SELECT roi.linked_part_id as part_id, roi.quantity FROM repair_order_items roi
      JOIN actions a ON roi.action_id = a.id
      WHERE roi.action_id = $1 AND a.organization_id = $2 AND roi.linked_part_id IS NOT NULL
      UNION
      SELECT ap.part_id, ap.quantity FROM action_parts ap
      JOIN actions a ON ap.action_id = a.id
      WHERE ap.action_id = $1 AND a.organization_id = $2
    `,
      [actionId, organizationId]
    );

    for (const ap of actionParts) {
      if (ap.part_id) {
        const qty = Math.round(parseFloat(ap.quantity || '0'));
        if (qty > 0) {
          await sql(
            `UPDATE parts SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2 AND organization_id = $3`,
            [qty, ap.part_id, organizationId]
          );
          const movId = crypto.randomUUID();
          await sql(
            `
            INSERT INTO stock_movements (id, organization_id, part_id, reference_action_id, action_id, type, quantity, reason, created_by)
            VALUES ($1, $2, $3, $4, $5, 'adjustment', $6, 'Annulation suppression ordre de réparation', $7)
          `,
            [movId, organizationId, ap.part_id, actionId, actionId, qty, userId]
          );
        }
      }
    }

    // 3. Delete related items, workers, draft invoices, and the action itself
    await sql(`DELETE FROM repair_order_items WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM action_parts WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM action_workers WHERE action_id = $1`, [actionId]);
    await sql(`DELETE FROM invoices WHERE action_id = $1 AND organization_id = $2`, [actionId, organizationId]);
    await sql(`DELETE FROM actions WHERE id = $1 AND organization_id = $2`, [actionId, organizationId]);

    // 4. Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'delete',
      metadata: { deleted_by: userId },
    });

    return apiSuccess({ message: 'Ordre de réparation supprimé avec succès et stock réajusté.' });
  } catch (error) {
    console.error('Failed to delete action:', error);
    return apiServerError();
  }
}
