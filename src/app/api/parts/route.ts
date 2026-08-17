import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/parts - List parts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    let parts;
    if (search) {
      parts = await sql(`
        SELECT * FROM parts
        WHERE name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1
        ORDER BY name ASC
      `, [`%${search}%`]);
    } else {
      parts = await sql(`SELECT * FROM parts ORDER BY name ASC`);
    }
    return NextResponse.json(parts);
  } catch (error) {
    console.error('Failed to get parts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/parts - Create a part in inventory
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
    const { name, category, sku, unit, purchase_price, sale_price, quantity_in_stock, min_stock_threshold } = body;

    if (!name || !category || !sku || purchase_price === undefined || sale_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate SKU
    const skuCheck = await sql(`SELECT id FROM parts WHERE sku = $1 LIMIT 1`, [sku]);
    if (skuCheck.length > 0) {
      return NextResponse.json({ error: 'A part with this SKU already exists' }, { status: 400 });
    }

    const buyPrice = parseFloat(purchase_price);
    const sellPrice = parseFloat(sale_price);
    const qty = parseInt(quantity_in_stock) || 0;
    const thresh = parseInt(min_stock_threshold) || 5;

    // Insert part
    const partRows = await sql(`
      INSERT INTO parts (name, category, sku, unit, purchase_price, sale_price, quantity_in_stock, min_stock_threshold)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, category, sku, unit || 'piece', buyPrice, sellPrice, qty, thresh]);

    const part = partRows[0];

    // Log stock movement for initial stock if > 0
    if (qty > 0) {
      await sql(`
        INSERT INTO stock_movements (part_id, type, quantity, reason, created_by)
        VALUES ($1, 'in', $2, 'Initial stock import', $3)
      `, [part.id, qty, userId]);
    }

    // Log audit
    await logAudit({
      userId,
      entityType: 'parts',
      entityId: part.id,
      action: 'create',
      metadata: { name, sku, qty }
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Failed to create part:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
