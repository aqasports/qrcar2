import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { sql } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

// GET /api/vehicles/[id] - Fetch single vehicle with full details, card, actions, appointments & reminders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    // Role check for technicians
    if (role === 'technician') {
      const workerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      if (workerRows.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const workerId = workerRows[0].id;

      // Verify technician is assigned to an action for this vehicle
      const check = await sql(`
        SELECT 1 FROM vehicles v
        JOIN actions a ON a.vehicle_id = v.id
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE v.id = $1 AND aw.worker_id = $2
        LIMIT 1
      `, [vehicleId, workerId]);

      if (check.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch vehicle with client name
    const vehicleRows = await sql(`
      SELECT v.*, c.full_name as client_name, c.phone as client_phone
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
      LIMIT 1
    `, [vehicleId]);

    if (vehicleRows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const vehicle = vehicleRows[0];

    // Fetch active PVC card if any
    const cardRows = await sql(`
      SELECT id, token, serial_label, status, linked_at
      FROM pvc_cards
      WHERE vehicle_id = $1 AND status = 'active'
      LIMIT 1
    `, [vehicleId]);
    const activeCard = cardRows.length > 0 ? cardRows[0] : null;

    // Fetch action history
    let actions = [];
    if (role === 'technician') {
      const workerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      const workerId = workerRows[0].id;

      actions = await sql(`
        SELECT a.id, a.type, a.description, a.status, a.mileage_at_service, a.date_in, a.date_out
        FROM actions a
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE a.vehicle_id = $1 AND aw.worker_id = $2
        ORDER BY a.date_in DESC
      `, [vehicleId, workerId]);
    } else {
      actions = await sql(`
        SELECT a.id, a.type, a.description, a.status, a.mileage_at_service, a.date_in, a.date_out, a.labor_cost
        FROM actions a
        WHERE a.vehicle_id = $1
        ORDER BY a.date_in DESC
      `, [vehicleId]);
    }

    // Fetch appointments for this vehicle
    const appointments = await sql(`
      SELECT * FROM appointments
      WHERE vehicle_id = $1
      ORDER BY preferred_date DESC, created_at DESC
    `, [vehicleId]);

    // Fetch reminders for this vehicle
    const reminders = await sql(`
      SELECT * FROM reminders
      WHERE vehicle_id = $1
      ORDER BY created_at DESC
    `, [vehicleId]);

    return NextResponse.json({ vehicle, activeCard, actions, appointments, reminders });
  } catch (error) {
    console.error('Failed to get vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/vehicles/[id] - Update vehicle specs, mileage, and maintenance targets
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  // Enforce permissions
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      plate_number, make, model, year, vin, color, current_mileage,
      fuel_type, transmission, engine_spec, oil_type, tire_size,
      next_service_mileage, next_service_date, next_inspection_date
    } = body;

    // Check vehicle exists
    const existing = await sql(`SELECT * FROM vehicles WHERE id = $1 LIMIT 1`, [vehicleId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const oldVehicle = existing[0];

    // Check duplicate plate if changed
    if (plate_number && plate_number !== oldVehicle.plate_number) {
      const dup = await sql(`SELECT id FROM vehicles WHERE plate_number = $1 LIMIT 1`, [plate_number]);
      if (dup.length > 0) {
        return NextResponse.json({ error: 'A vehicle with this plate number already exists' }, { status: 400 });
      }
    }

    // Update fields
    const updatedRows = await sql(`
      UPDATE vehicles
      SET plate_number = COALESCE($1, plate_number),
          make = COALESCE($2, make),
          model = COALESCE($3, model),
          year = COALESCE($4, year),
          vin = COALESCE($5, vin),
          color = COALESCE($6, color),
          current_mileage = COALESCE($7, current_mileage),
          fuel_type = COALESCE($8, fuel_type),
          transmission = COALESCE($9, transmission),
          engine_spec = COALESCE($10, engine_spec),
          oil_type = COALESCE($11, oil_type),
          tire_size = COALESCE($12, tire_size),
          next_service_mileage = COALESCE($13, next_service_mileage),
          next_service_date = COALESCE($14, next_service_date),
          next_inspection_date = COALESCE($15, next_inspection_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `, [
      plate_number,
      make,
      model,
      year ? parseInt(year) : null,
      vin,
      color,
      current_mileage ? parseInt(current_mileage) : null,
      fuel_type,
      transmission,
      engine_spec,
      oil_type,
      tire_size,
      next_service_mileage ? parseInt(next_service_mileage) : null,
      next_service_date || null,
      next_inspection_date || null,
      vehicleId
    ]);

    const updatedVehicle = updatedRows[0];

    // Log audit
    await logAudit({
      userId,
      entityType: 'vehicles',
      entityId: vehicleId,
      action: 'update',
      metadata: {
        changes: {
          plate_number: plate_number !== oldVehicle.plate_number ? plate_number : undefined,
          current_mileage: current_mileage !== oldVehicle.current_mileage ? current_mileage : undefined
        }
      }
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Failed to update vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
