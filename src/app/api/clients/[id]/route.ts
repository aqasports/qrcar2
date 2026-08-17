import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { sql } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

// GET /api/clients/[id] - Get details of a single client
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
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

      // Verify technician worked on this client's vehicles
      const check = await sql(`
        SELECT 1 FROM clients c
        JOIN vehicles v ON v.client_id = c.id
        JOIN actions a ON a.vehicle_id = v.id
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE c.id = $1 AND aw.worker_id = $2
        LIMIT 1
      `, [clientId, workerId]);

      if (check.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch client details
    const clientRows = await sql(`SELECT * FROM clients WHERE id = $1 LIMIT 1`, [clientId]);
    if (clientRows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientRows[0];

    // Fetch client vehicles
    const vehicles = await sql(`SELECT * FROM vehicles WHERE client_id = $1`, [clientId]);

    return NextResponse.json({ client, vehicles });
  } catch (error) {
    console.error('Failed to get client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
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
    const { full_name, phone, email, address, notes } = body;

    // Check client exists
    const existing = await sql(`SELECT * FROM clients WHERE id = $1 LIMIT 1`, [clientId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    const oldClient = existing[0];

    // Check duplicate phone if changed
    if (phone && phone !== oldClient.phone) {
      const dup = await sql(`SELECT id FROM clients WHERE phone = $1 LIMIT 1`, [phone]);
      if (dup.length > 0) {
        return NextResponse.json({ error: 'A client with this phone number already exists' }, { status: 400 });
      }
    }

    // Update fields
    const updatedRows = await sql(`
      UPDATE clients
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          notes = COALESCE($5, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [full_name, phone, email, address, notes, clientId]);

    const updatedClient = updatedRows[0];

    // Log audit
    await logAudit({
      userId,
      entityType: 'clients',
      entityId: clientId,
      action: 'update',
      metadata: {
        changes: {
          full_name: full_name !== oldClient.full_name ? full_name : undefined,
          phone: phone !== oldClient.phone ? phone : undefined
        }
      }
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
