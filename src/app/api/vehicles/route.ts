import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/vehicles - List/search vehicles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    let vehicles = [];

    if (role === 'technician') {
      const workerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      if (workerRows.length === 0) {
        return NextResponse.json([]);
      }
      const workerId = workerRows[0].id;

      // Technicians only see vehicles they've worked on
      const query = `
        SELECT DISTINCT v.*, c.full_name as client_name
        FROM vehicles v
        LEFT JOIN clients c ON v.client_id = c.id
        JOIN actions a ON a.vehicle_id = v.id
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE aw.worker_id = $1
          AND (v.plate_number ILIKE $2 OR v.make ILIKE $2 OR v.model ILIKE $2)
        ORDER BY v.plate_number ASC
      `;
      vehicles = await sql(query, [workerId, `%${search}%`]);
    } else {
      // Admins and managers see all vehicles
      const query = `
        SELECT v.*, c.full_name as client_name
        FROM vehicles v
        LEFT JOIN clients c ON v.client_id = c.id
        WHERE v.plate_number ILIKE $1 OR v.make ILIKE $1 OR v.model ILIKE $1
        ORDER BY v.plate_number ASC
      `;
      vehicles = await sql(query, [`%${search}%`]);
    }

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Failed to get vehicles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/vehicles - Create vehicle
export async function POST(req: NextRequest) {
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
      client_id,
      plate_number,
      make,
      model,
      year,
      vin,
      color,
      current_mileage,
      fuel_type,
      transmission,
      engine_spec,
      oil_type,
      tire_size,
    } = body;

    if (!plate_number || !make || !model || !year) {
      return NextResponse.json({ error: 'Veuillez remplir les champs obligatoires (Immatriculation, Marque, Modèle, Année).' }, { status: 400 });
    }

    // Verify client exists if client_id is provided
    let verifiedClientId = client_id || null;
    if (verifiedClientId) {
      const clientCheck = await sql(`SELECT id FROM clients WHERE id = $1 LIMIT 1`, [verifiedClientId]);
      if (clientCheck.length === 0) {
        return NextResponse.json({ error: 'Client titulaire introuvable.' }, { status: 400 });
      }
    }

    // Check duplicate plate
    const plateCheck = await sql(`SELECT id FROM vehicles WHERE plate_number = $1 LIMIT 1`, [plate_number.trim().toUpperCase()]);
    if (plateCheck.length > 0) {
      return NextResponse.json({ error: 'Un véhicule avec ce numéro d\'immatriculation existe déjà dans le système.' }, { status: 400 });
    }

    // Insert vehicle
    const rows = await sql(
      `INSERT INTO vehicles (
        client_id, plate_number, make, model, year, vin, color, current_mileage,
        fuel_type, transmission, engine_spec, oil_type, tire_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        verifiedClientId,
        plate_number.trim().toUpperCase(),
        make.trim(),
        model.trim(),
        parseInt(year, 10),
        vin?.trim() || null,
        color?.trim() || null,
        parseInt(current_mileage, 10) || 0,
        fuel_type || 'diesel',
        transmission || 'manuelle',
        engine_spec?.trim() || null,
        oil_type?.trim() || null,
        tire_size?.trim() || null,
      ]
    );

    const vehicle = rows[0];

    // Log audit
    await logAudit({
      userId,
      entityType: 'vehicles',
      entityId: vehicle.id,
      action: 'create',
      metadata: {
        plate_number: vehicle.plate_number,
        make: vehicle.make,
        model: vehicle.model,
        client_id: verifiedClientId,
      }
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Failed to create vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
