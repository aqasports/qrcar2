import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { sql } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

// PATCH /api/appointments/[id] - Update appointment status or details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, garage_response, preferred_date, preferred_time_slot, notes } = body;

    const existingRows = await sql(`SELECT * FROM appointments WHERE id = $1 LIMIT 1`, [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const updatedRows = await sql(`
      UPDATE appointments
      SET status = COALESCE($1, status),
          garage_response = COALESCE($2, garage_response),
          preferred_date = COALESCE($3, preferred_date),
          preferred_time_slot = COALESCE($4, preferred_time_slot),
          notes = COALESCE($5, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [status, garage_response, preferred_date, preferred_time_slot, notes, id]);

    await logAudit({
      userId,
      entityType: 'appointments',
      entityId: id,
      action: 'update',
      metadata: { status, garage_response }
    });

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/appointments/[id]/convert - Convert appointment to an open Service Action
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId } = session.user;

  try {
    // 1. Fetch appointment with vehicle
    const appRows = await sql(`
      SELECT a.*, v.current_mileage as v_mileage
      FROM appointments a
      JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.id = $1
      LIMIT 1
    `, [id]);

    if (appRows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const app = appRows[0];
    const mileageAtService = app.current_mileage || app.v_mileage || 0;

    // Map service_type to action type
    let actionType: 'repair' | 'maintenance' | 'inspection' | 'other' = 'maintenance';
    const sLower = (app.service_type || '').toLowerCase();
    if (sLower.includes('réparation') || sLower.includes('frein') || sLower.includes('courroie') || sLower.includes('bruit')) {
      actionType = 'repair';
    } else if (sLower.includes('contrôle') || sLower.includes('diagnostic')) {
      actionType = 'inspection';
    }

    const actionDesc = `${app.service_type}${app.notes ? ` — ${app.notes}` : ''}`;

    // 2. Create Action in DB
    const actionRows = await sql(`
      INSERT INTO actions (
        vehicle_id, type, description, client_visible_notes, internal_notes,
        mileage_at_service, status, labor_cost, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'open', 0.00, $7)
      RETURNING *
    `, [
      app.vehicle_id,
      actionType,
      actionDesc,
      `Prise en charge suite au rendez-vous du ${new Date(app.preferred_date).toLocaleDateString()}`,
      `Rendez-vous client source (Téléphone: ${app.client_phone || 'Non renseigné'})`,
      mileageAtService,
      userId,
    ]);

    const createdAction = actionRows[0];

    // 3. Mark appointment as completed
    await sql(`
      UPDATE appointments
      SET status = 'completed',
          garage_response = 'Converti en intervention atelier',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    await logAudit({
      userId,
      entityType: 'actions',
      entityId: createdAction.id,
      action: 'create',
      metadata: { converted_from_appointment_id: id }
    });

    return NextResponse.json({
      success: true,
      action: createdAction,
      message: 'Rendez-vous converti en intervention avec succès.'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to convert appointment to action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
