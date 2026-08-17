import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// DELETE /api/actions/[id]/parts/[partId] - Detach part from action (revert stock)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const { id: actionId, partId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    // 1. Verify action exists and is not invoiced
    const actionRows = await sql(`SELECT id, status FROM actions WHERE id = $1 LIMIT 1`, [actionId]);
    if (actionRows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    const action = actionRows[0];
    if (action.status === 'invoiced') {
      return NextResponse.json({ error: 'Cannot modify parts for an invoiced action' }, { status: 400 });
    }

    // Role check for technicians: verify they are assigned to this action
    if (role === 'technician') {
      const userWorkerRows = await sql(`SELECT id FROM workers WHERE user_id = $1 LIMIT 1`, [userId]);
      if (userWorkerRows.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const workerId = userWorkerRows[0].id;
      const assignCheck = await sql(`
        SELECT 1 FROM action_workers 
        WHERE action_id = $1 AND worker_id = $2 
        LIMIT 1
      `, [actionId, workerId]);

      if (assignCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden. You are not assigned to this action.' }, { status: 403 });
      }
    }

    // 2. Verify part is attached and get quantity
    const junctionCheck = await sql(`
      SELECT quantity FROM action_parts 
      WHERE action_id = $1 AND part_id = $2 
      LIMIT 1
    `, [actionId, partId]);

    if (junctionCheck.length === 0) {
      return NextResponse.json({ error: 'Part association not found on this action' }, { status: 404 });
    }

    const qty = junctionCheck[0].quantity;

    // 3. Perform atomic operations: detach part, increment stock, write movement
    // Delete junction
    await sql(`
      DELETE FROM action_parts 
      WHERE action_id = $1 AND part_id = $2
    `, [actionId, partId]);

    // Revert stock (increment)
    await sql(`
      UPDATE parts
      SET quantity_in_stock = quantity_in_stock + $1
      WHERE id = $2
    `, [qty, partId]);

    // Insert stock movement ledger log
    await sql(`
      INSERT INTO stock_movements (part_id, type, quantity, reference_action_id, reason, created_by)
      VALUES ($1, 'in', $2, $3, 'Removed/Detached from service action', $4)
    `, [partId, qty, actionId, userId]);

    // 4. Log audit trail
    await logAudit({
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'update',
      metadata: {
        part_detached: partId,
        quantity_reverted: qty
      }
    });

    return NextResponse.json({ message: 'Part detached and stock reverted successfully' });
  } catch (error) {
    console.error('Failed to detach part from action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
