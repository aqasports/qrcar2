import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/clients - List and search clients scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        return NextResponse.json([]);
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

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to get clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/clients - Create client scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { full_name, phone, email, address, notes } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate phone within this organization
    const existing = await sql(
      `SELECT id FROM clients WHERE phone = $1 AND organization_id = $2 LIMIT 1`,
      [phone, organizationId]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A client with this phone number already exists in your garage' },
        { status: 400 }
      );
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

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
