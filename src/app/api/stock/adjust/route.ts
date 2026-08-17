import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/stock/adjust - Manual stock adjustment
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
    const { part_id, type, quantity, reason } = body;

    if (!part_id || !type || quantity === undefined || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['in', 'out', 'adjustment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty)) {
      return NextResponse.json({ error: 'Quantity must be a valid integer' }, { status: 400 });
    }

    // 1. Fetch part
    const partRows = await sql(`SELECT * FROM parts WHERE id = $1 LIMIT 1`, [part_id]);
    if (partRows.length === 0) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }
    const part = partRows[0];

    let newQty = part.quantity_in_stock;
    let ledgerQty = qty;

    if (type === 'in') {
      if (qty <= 0) return NextResponse.json({ error: 'Quantity must be positive for In movements' }, { status: 400 });
      newQty = part.quantity_in_stock + qty;
    } else if (type === 'out') {
      if (qty <= 0) return NextResponse.json({ error: 'Quantity must be positive for Out movements' }, { status: 400 });
      newQty = part.quantity_in_stock - qty;
    } else if (type === 'adjustment') {
      newQty = qty;
      ledgerQty = qty - part.quantity_in_stock; // delta to log in ledger
    }

    if (newQty < 0) {
      return NextResponse.json({ error: 'Operation would result in negative stock' }, { status: 400 });
    }

    // 2. Perform updates in a single block
    await sql(`UPDATE parts SET quantity_in_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newQty, part_id]);

    // 3. Log stock movement
    await sql(`
      INSERT INTO stock_movements (part_id, type, quantity, reason, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [part_id, type, ledgerQty, reason, userId]);

    // 4. Log audit
    await logAudit({
      userId,
      entityType: 'parts',
      entityId: part_id,
      action: 'update',
      metadata: {
        adjustment_type: type,
        old_qty: part.quantity_in_stock,
        new_qty: newQty,
        reason
      }
    });

    return NextResponse.json({ message: 'Stock adjusted successfully', quantity_in_stock: newQty });
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
