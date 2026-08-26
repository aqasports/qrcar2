import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createClientSchema, validateRequestBody } from '@/lib/validation/schemas';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiConflict,
  apiServerError,
} from '@/lib/api/response';

// GET /api/clients - List and search clients scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    let clients = [];

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
        SELECT DISTINCT c.*
        FROM clients c
        JOIN vehicles v ON v.client_id = c.id AND v.organization_id = $1
        JOIN actions a ON a.vehicle_id = v.id AND a.organization_id = $1
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE c.organization_id = $1
          AND aw.worker_id = $2
          AND (c.full_name ILIKE $3 OR c.phone ILIKE $3)
        ORDER BY c.full_name ASC
      `;
      clients = await sql(query, [organizationId, workerId, `%${search}%`]);
    } else {
      const query = `
        SELECT * FROM clients
        WHERE organization_id = $1
          AND (full_name ILIKE $2 OR phone ILIKE $2)
        ORDER BY full_name ASC
      `;
      clients = await sql(query, [organizationId, `%${search}%`]);
    }

    return apiSuccess(clients);
  } catch (error) {
    console.error('Failed to get clients:', error);
    return apiServerError();
  }
}

// POST /api/clients - Create client scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return apiForbidden('Les techniciens n’ont pas l’autorisation de créer des fiches clients.');
  }

  const validation = await validateRequestBody(createClientSchema, req);
  if (!validation.success) {
    return apiError(validation.error, 'VALIDATION_ERROR', 400, validation.issues);
  }

  const { full_name, phone, email, address, notes } = validation.data;

  try {
    // Check duplicate phone within this organization
    const existing = await sql(
      `SELECT id FROM clients WHERE phone = $1 AND organization_id = $2 LIMIT 1`,
      [phone, organizationId]
    );
    if (existing.length > 0) {
      return apiConflict('Un client avec ce numéro de téléphone existe déjà dans votre atelier.');
    }

    // Insert client with organization_id
    const rows = await sql(
      `INSERT INTO clients (organization_id, full_name, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, full_name, phone, email || null, address || null, notes || null]
    );

    const client = rows[0];

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'clients',
      entityId: client.id,
      action: 'create',
      metadata: { full_name, phone },
    });

    return apiSuccess(client, 201);
  } catch (error) {
    console.error('Failed to create client:', error);
    return apiServerError('Impossible d’enregistrer le client en base.');
  }
}
