import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/workers - List workers scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId } = session.user;

  try {
    let workers;
    if (role === 'technician') {
      workers = await sql(
        `
        SELECT id, full_name, phone, role, active, user_id 
        FROM workers 
        WHERE active = true AND organization_id = $1
        ORDER BY full_name ASC
      `,
        [organizationId]
      );
    } else {
      workers = await sql(
        `
        SELECT * FROM workers 
        WHERE organization_id = $1
        ORDER BY full_name ASC
      `,
        [organizationId]
      );
    }
    return NextResponse.json(workers);
  } catch (error) {
    console.error('Failed to get workers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/workers - Create worker scoped to organization
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
    const { full_name, phone, worker_role, hourly_rate, user_id } = body;

    if (!full_name || !worker_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hourlyRateNum = parseFloat(hourly_rate) || 0.0;

    const rows = await sql(
      `
      INSERT INTO workers (organization_id, full_name, phone, role, hourly_rate, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [organizationId, full_name, phone || null, worker_role, hourlyRateNum, user_id || null]
    );

    const worker = rows[0];

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'workers',
      entityId: worker.id,
      action: 'create',
      metadata: { full_name, role: worker_role },
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error('Failed to create worker:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
