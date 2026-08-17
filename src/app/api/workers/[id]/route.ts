import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// PATCH /api/workers/[id] - Update worker
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workerId } = await params;
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
    const { full_name, phone, worker_role, hourly_rate, user_id, active } = body;

    // Check worker exists
    const check = await sql(`SELECT * FROM workers WHERE id = $1 LIMIT 1`, [workerId]);
    if (check.length === 0) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }
    const oldWorker = check[0];

    const hourlyRateNum = hourly_rate !== undefined ? parseFloat(hourly_rate) : undefined;

    const updatedRows = await sql(`
      UPDATE workers
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          role = COALESCE($3, role),
          hourly_rate = COALESCE($4, hourly_rate),
          user_id = COALESCE($5, user_id),
          active = COALESCE($6, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [full_name, phone, worker_role, hourlyRateNum, user_id, active, workerId]);

    const updatedWorker = updatedRows[0];

    // Log audit
    await logAudit({
      userId,
      entityType: 'workers',
      entityId: workerId,
      action: 'update',
      metadata: {
        changes: {
          full_name: full_name !== oldWorker.full_name ? full_name : undefined,
          role: worker_role !== oldWorker.role ? worker_role : undefined,
          active: active !== oldWorker.active ? active : undefined
        }
      }
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error('Failed to update worker:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
