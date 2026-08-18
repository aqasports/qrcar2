import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/parts - List parts scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    let parts;
    if (search) {
      parts = await sql(
        `
        SELECT * FROM parts
        WHERE organization_id = $1 AND (name ILIKE $2 OR sku ILIKE $2 OR category ILIKE $2)
        ORDER BY name ASC
      `,
        [organizationId, `%${search}%`]
      );
    } else {
      parts = await sql(
        `SELECT * FROM parts WHERE organization_id = $1 ORDER BY name ASC`,
        [organizationId]
      );
    }
    return NextResponse.json(parts);
  } catch (error) {
    console.error('Failed to get parts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/parts - Create a part in inventory scoped to organization
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
    const { name, category, sku, unit, purchase_price, sale_price, quantity_in_stock, min_stock_threshold } = body;

    if (!name || !category || !sku || purchase_price === undefined || sale_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate SKU in this organization
    const skuCheck = await sql(
      `SELECT id FROM parts WHERE sku = $1 AND organization_id = $2 LIMIT 1`,
      [sku, organizationId]
    );
    if (skuCheck.length > 0) {
      return NextResponse.json({ error: 'A part with this SKU already exists in your garage' }, { status: 400 });
    }

    const buyPrice = parseFloat(purchase_price);
    const sellPrice = parseFloat(sale_price);
    const qty = parseInt(quantity_in_stock) || 0;
    const thresh = parseInt(min_stock_threshold) || 5;

    // Insert part with organization_id
    const partRows = await sql(
      `
      INSERT INTO parts (organization_id, name, category, sku, unit, purchase_price, sale_price, quantity_in_stock, min_stock_threshold)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [organizationId, name, category, sku, unit || 'piece', buyPrice, sellPrice, qty, thresh]
    );

    const part = partRows[0];

    // Log stock movement for initial stock if > 0
    if (qty > 0) {
      await sql(
        `
        INSERT INTO stock_movements (organization_id, part_id, type, quantity, reason, created_by)
        VALUES ($1, $2, 'in', $3, 'Initial stock import', $4)
      `,
        [organizationId, part.id, qty, userId]
      );
    }

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'parts',
      entityId: part.id,
      action: 'create',
      metadata: { name, sku, qty },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Failed to create part:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
