import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createVehicleSchema, validateRequestBody } from '@/lib/validation/schemas';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiConflict,
  apiServerError,
} from '@/lib/api/response';

// GET /api/vehicles - List/search vehicles scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    let vehicles = [];

    if (role === 'technician') {
      const workerRows = await sql(
        `SELECT id FROM workers WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
        [userId, organizationId]
      );
      if (workerRows.length === 0) {
        return apiSuccess([]);
      }
      const workerId = workerRows[0].id;

      const query = `
        SELECT DISTINCT v.*, c.full_name as client_name
        FROM vehicles v
        LEFT JOIN clients c ON v.client_id = c.id
        JOIN actions a ON a.vehicle_id = v.id AND a.organization_id = $1
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE v.organization_id = $1
          AND aw.worker_id = $2
          AND (v.plate_number ILIKE $3 OR v.make ILIKE $3 OR v.model ILIKE $3)
        ORDER BY v.plate_number ASC
      `;
      vehicles = await sql(query, [organizationId, workerId, `%${search}%`]);
    } else {
      const query = `
        SELECT v.*, c.full_name as client_name
        FROM vehicles v
        LEFT JOIN clients c ON v.client_id = c.id
        WHERE v.organization_id = $1
          AND (v.plate_number ILIKE $2 OR v.make ILIKE $2 OR v.model ILIKE $2)
        ORDER BY v.plate_number ASC
      `;
      vehicles = await sql(query, [organizationId, `%${search}%`]);
    }

    return apiSuccess(vehicles);
  } catch (error) {
    console.error('Failed to get vehicles:', error);
    return apiServerError();
  }
}

// POST /api/vehicles - Create vehicle scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return apiForbidden('Les techniciens n’ont pas l’autorisation d’enregistrer des véhicules.');
  }

  const validation = await validateRequestBody(createVehicleSchema, req);
  if (!validation.success) {
    return apiError(validation.error, 'VALIDATION_ERROR', 400, validation.issues);
  }

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
  } = validation.data;

  try {
    let verifiedClientId = client_id || null;
    if (verifiedClientId) {
      const clientCheck = await sql(
        `SELECT id FROM clients WHERE id = $1 AND organization_id = $2 LIMIT 1`,
        [verifiedClientId, organizationId]
      );
      if (clientCheck.length === 0) {
        return apiError('Client titulaire introuvable.', 'CLIENT_NOT_FOUND', 404);
      }
    }

    // Check duplicate plate within this organization
    const plateCheck = await sql(
      `SELECT id FROM vehicles WHERE plate_number = $1 AND organization_id = $2 LIMIT 1`,
      [plate_number.trim().toUpperCase(), organizationId]
    );
    if (plateCheck.length > 0) {
      return apiConflict('Un véhicule avec ce numéro d’immatriculation existe déjà dans votre atelier.');
    }

    // Insert vehicle with organization_id
    const rows = await sql(
      `INSERT INTO vehicles (
        organization_id, client_id, plate_number, make, model, year, vin, color, current_mileage,
        fuel_type, transmission, engine_spec, oil_type, tire_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        organizationId,
        verifiedClientId,
        plate_number.trim().toUpperCase(),
        make.trim(),
        model.trim(),
        year,
        vin?.trim() || null,
        color?.trim() || null,
        current_mileage || 0,
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
      organizationId,
      userId,
      entityType: 'vehicles',
      entityId: vehicle.id,
      action: 'create',
      metadata: {
        plate_number: vehicle.plate_number,
        make: vehicle.make,
        model: vehicle.model,
        client_id: verifiedClientId,
      },
    });

    return apiSuccess(vehicle, 201);
  } catch (error) {
    console.error('Failed to create vehicle:', error);
    return apiServerError('Impossible d’enregistrer le véhicule en base.');
  }
}
