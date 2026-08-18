import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// PATCH /api/parts/[id] - Update part info scoped to organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: partId } = await params;
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
    const { name, category, sku, unit, purchase_price, sale_price, min_stock_threshold, active } = body;

    // Check part exists in this organization
    const check = await sql(
      `SELECT * FROM parts WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [partId, organizationId]
    );
    if (check.length === 0) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }
    const oldPart = check[0];

    // Check duplicate SKU if changed within this organization
    if (sku && sku !== oldPart.sku) {
      const dup = await sql(
        `SELECT id FROM parts WHERE sku = $1 AND organization_id = $2 LIMIT 1`,
        [sku, organizationId]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'A part with this SKU already exists in your garage' }, { status: 400 });
      }
    }

    const buyPrice = purchase_price !== undefined ? parseFloat(purchase_price) : undefined;
    const sellPrice = sale_price !== undefined ? parseFloat(sale_price) : undefined;
    const thresh = min_stock_threshold !== undefined ? parseInt(min_stock_threshold) : undefined;

    const updatedRows = await sql(
      `
      UPDATE parts
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          sku = COALESCE($3, sku),
          unit = COALESCE($4, unit),
          purchase_price = COALESCE($5, purchase_price),
          sale_price = COALESCE($6, sale_price),
          min_stock_threshold = COALESCE($7, min_stock_threshold),
          active = COALESCE($8, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND organization_id = $10
      RETURNING *
    `,
      [name, category, sku, unit, buyPrice, sellPrice, thresh, active, partId, organizationId]
    );

    const updatedPart = updatedRows[0];

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'parts',
      entityId: partId,
      action: 'update',
      metadata: {
        changes: {
          name: name !== oldPart.name ? name : undefined,
          sku: sku !== oldPart.sku ? sku : undefined,
          sale_price: sellPrice !== oldPart.sale_price ? sellPrice : undefined,
        },
      },
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    console.error('Failed to update part:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
