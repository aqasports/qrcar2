import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { sql } from '../../../lib/db';
import { logAudit } from '../../../lib/audit';

// GET /api/appointments - Fetch all appointments with vehicle & client metadata
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');

  try {
    let query = `
      SELECT a.*, 
             v.plate_number, v.make, v.model, v.year, v.current_mileage as vehicle_current_mileage,
             c.id as client_id, c.full_name as client_name, c.phone as client_phone_registered
      FROM appointments a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN clients c ON v.client_id = c.id
    `;
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'all') {
      query += ` WHERE a.status = $1`;
      params.push(statusFilter);
    }

    query += ` ORDER BY a.preferred_date ASC, a.created_at DESC`;

    const appointments = await sql(query, params);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/appointments - Create appointment from admin panel
export async function POST(req: NextRequest) {
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
    const { vehicle_id, service_type, preferred_date, preferred_time_slot, current_mileage, notes, client_phone, status } = body;

    if (!vehicle_id || !service_type || !preferred_date) {
      return NextResponse.json({ error: 'Vehicle, service type, and preferred date are required.' }, { status: 400 });
    }

    const rows = await sql(`
      INSERT INTO appointments (
        vehicle_id, service_type, preferred_date, preferred_time_slot,
        current_mileage, notes, client_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      vehicle_id,
      service_type,
      preferred_date,
      preferred_time_slot || 'morning',
      current_mileage ? parseInt(current_mileage, 10) : null,
      notes || null,
      client_phone || null,
      status || 'confirmed',
    ]);

    await logAudit({
      userId,
      entityType: 'appointments',
      entityId: rows[0].id,
      action: 'create',
      metadata: { service_type, preferred_date, status: rows[0].status }
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
