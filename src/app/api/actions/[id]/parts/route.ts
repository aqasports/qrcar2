import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/actions/[id]/parts - Attach part to action
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    const body = await req.json();
    const { part_id, quantity, force_override } = body;

    const qty = parseInt(quantity);
    if (!part_id || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Invalid part_id or quantity' }, { status: 400 });
    }

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

    // 2. Fetch part information
    const partRows = await sql(`SELECT id, name, sale_price, quantity_in_stock, active FROM parts WHERE id = $1 LIMIT 1`, [part_id]);
    if (partRows.length === 0) {
      return NextResponse.json({ error: 'Part not found in inventory' }, { status: 404 });
    }
    const part = partRows[0];
    if (!part.active) {
      return NextResponse.json({ error: 'Part is marked as inactive in catalog' }, { status: 400 });
    }

    // 3. Stock availability validation
    const hasInsufficientStock = part.quantity_in_stock < qty;
    let overrideLogged = false;

    if (hasInsufficientStock) {
      if (!force_override) {
        return NextResponse.json({
          error: 'insufficient_stock',
          message: `Requested quantity (${qty}) exceeds available stock (${part.quantity_in_stock}).`,
          available: part.quantity_in_stock
        }, { status: 400 });
      }

      // If force_override is true, only allow managers or admins
      if (role === 'technician') {
        return NextResponse.json({
          error: 'insufficient_stock_denied',
          message: 'Insufficient stock. Overrides require manager approval.'
        }, { status: 403 });
      }

      overrideLogged = true;
    }

    const currentSalePrice = parseFloat(part.sale_price);

    // 4. Perform atomic operations: attach part, decrement stock, insert ledger
    // Insert or update action_parts. Note: if updating, snapshot must still represent the original snapshot or update it?
    // The rules say: "Insert the action_parts row with unit_price_snapshot = part's CURRENT sale_price at that instant"
    // Let's do an upsert or check if already exists. If already exists, we increment quantity.
    const existingJunction = await sql(`
      SELECT quantity FROM action_parts 
      WHERE action_id = $1 AND part_id = $2 
      LIMIT 1
    `, [actionId, part_id]);

    if (existingJunction.length > 0) {
      // Update quantity
      await sql(`
        UPDATE action_parts
        SET quantity = quantity + $1
        WHERE action_id = $2 AND part_id = $3
      `, [qty, actionId, part_id]);
    } else {
      // Insert new association
      await sql(`
        INSERT INTO action_parts (action_id, part_id, quantity, unit_price_snapshot)
        VALUES ($1, $2, $3, $4)
      `, [actionId, part_id, qty, currentSalePrice]);
    }

    // Decrement parts.quantity_in_stock
    await sql(`
      UPDATE parts
      SET quantity_in_stock = quantity_in_stock - $1
      WHERE id = $2
    `, [qty, part_id]);

    // Insert stock movement ledger log
    await sql(`
      INSERT INTO stock_movements (part_id, type, quantity, reference_action_id, reason, created_by)
      VALUES ($1, 'out', $2, $3, $4, $5)
    `, [part_id, qty, actionId, `Used in action (Status: ${action.status})`, userId]);

    // 5. Log audit trail
    await logAudit({
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'update',
      metadata: {
        part_attached: part_id,
        quantity: qty,
        unit_price_snapshot: currentSalePrice,
        stock_overridden: overrideLogged
      }
    });

    return NextResponse.json({
      message: 'Part attached successfully',
      part_id,
      quantity_attached: qty,
      unit_price_snapshot: currentSalePrice
    });
  } catch (error) {
    console.error('Failed to attach part to action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
