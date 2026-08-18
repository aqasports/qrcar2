import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/actions - List service actions scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicle_id') || '';

  try {
    let actions = [];

    if (role === 'technician') {
      const workerRows = await sql(
        `SELECT id FROM workers WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
        [userId, organizationId]
      );
      if (workerRows.length === 0) {
        return NextResponse.json([]);
      }
      const workerId = workerRows[0].id;

      // Technicians only see actions they are assigned to within their organization
      let query = `
        SELECT DISTINCT a.*, v.plate_number, v.make, v.model, COALESCE(c.full_name, 'Stock / Non assigné') as client_name
        FROM actions a
        JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
        LEFT JOIN clients c ON v.client_id = c.id
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE a.organization_id = $1 AND aw.worker_id = $2
      `;
      const params = [organizationId, workerId];
      if (vehicleId) {
        query += ` AND a.vehicle_id = $3`;
        params.push(vehicleId);
      }
      query += ` ORDER BY a.date_in DESC`;
      actions = await sql(query, params);
    } else {
      // Owners, Admins, and Managers see all actions in their organization
      let query = `
        SELECT a.*, v.plate_number, v.make, v.model, COALESCE(c.full_name, 'Stock / Non assigné') as client_name
        FROM actions a
        JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
        LEFT JOIN clients c ON v.client_id = c.id
        WHERE a.organization_id = $1
      `;
      const params = [organizationId];
      if (vehicleId) {
        query += ` AND a.vehicle_id = $2`;
        params.push(vehicleId);
      }
      query += ` ORDER BY a.date_in DESC`;
      actions = await sql(query, params);
    }

    return NextResponse.json(actions);
  } catch (error) {
    console.error('Failed to get actions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/actions - Create action scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId } = session.user;

  try {
    const body = await req.json();
    const {
      vehicle_id,
      type,
      description,
      client_visible_notes,
      internal_notes,
      mileage_at_service,
      status,
      labor_cost,
      workers, // Array<{ worker_id: string, role_on_job: 'lead' | 'assist' }>
    } = body;

    if (!vehicle_id || !type || !description || mileage_at_service === undefined || mileage_at_service === null) {
      return NextResponse.json(
        { error: 'Veuillez remplir les champs obligatoires (Véhicule, Type, Description, Kilométrage).' },
        { status: 400 }
      );
    }

    const mileage = parseInt(mileage_at_service, 10);
    const labor = parseFloat(labor_cost) || 0.0;

    // Verify vehicle belongs to this organization
    const vehicleCheck = await sql(
      `SELECT id, current_mileage FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [vehicle_id, organizationId]
    );
    if (vehicleCheck.length === 0) {
      return NextResponse.json({ error: 'Véhicule introuvable.' }, { status: 400 });
    }

    // Insert action with organization_id
    const actionRows = await sql(
      `
      INSERT INTO actions (organization_id, vehicle_id, type, description, client_visible_notes, internal_notes, mileage_at_service, status, labor_cost, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        organizationId,
        vehicle_id,
        type,
        description,
        client_visible_notes || null,
        internal_notes || null,
        mileage,
        status || 'open',
        labor,
        userId,
      ]
    );

    const action = actionRows[0];

    // Assign workers if any (ensuring workers belong to this organization)
    if (Array.isArray(workers) && workers.length > 0) {
      for (const w of workers) {
        if (w.worker_id) {
          const workerCheck = await sql(
            `SELECT id FROM workers WHERE id = $1 AND organization_id = $2 LIMIT 1`,
            [w.worker_id, organizationId]
          );
          if (workerCheck.length > 0) {
            await sql(
              `
              INSERT INTO action_workers (action_id, worker_id, role_on_job)
              VALUES ($1, $2, $3)
              ON CONFLICT (action_id, worker_id) DO NOTHING
            `,
              [action.id, w.worker_id, w.role_on_job || 'lead']
            );
          }
        }
      }
    }

    // Update vehicle mileage if higher
    if (mileage > vehicleCheck[0].current_mileage) {
      await sql(
        `UPDATE vehicles SET current_mileage = $1 WHERE id = $2 AND organization_id = $3`,
        [mileage, vehicle_id, organizationId]
      );
    }

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'actions',
      entityId: action.id,
      action: 'create',
      metadata: { type, vehicle_id, status },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error('Failed to create action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
