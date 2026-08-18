import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

// PATCH /api/platform-admin/card-orders/[id] - Update order status (in_production, shipped, delivered)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, isPlatformAdmin, id: userId } = session.user;
  if (!isPlatformAdmin && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden. Platform Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, tracking_number, carrier_name } = body;

    const existing = await sql(
      `
      SELECT co.*, o.slug as org_slug, o.name as org_name
      FROM card_orders co
      JOIN organizations o ON co.organization_id = o.id
      WHERE co.id = $1
      LIMIT 1
    `,
      [orderId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = existing[0];
    const previousStatus = order.status;

    let shippedAt = order.shipped_at;
    let deliveredAt = order.delivered_at;

    if (status === 'shipped' && !order.shipped_at) {
      shippedAt = new Date().toISOString();
    }
    if (status === 'delivered' && !order.delivered_at) {
      deliveredAt = new Date().toISOString();
    }

    const updatedRows = await sql(
      `
      UPDATE card_orders
      SET status = COALESCE($1, status),
          tracking_number = COALESCE($2, tracking_number),
          carrier_name = COALESCE($3, carrier_name),
          shipped_at = $4,
          delivered_at = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `,
      [
        status || null,
        tracking_number !== undefined ? tracking_number : null,
        carrier_name !== undefined ? carrier_name : null,
        shippedAt,
        deliveredAt,
        orderId,
      ]
    );

    const updatedOrder = updatedRows[0];

    // AUTOMATION: If order transitions to 'delivered', auto-generate physical cards in organization's stock
    if (status === 'delivered' && previousStatus !== 'delivered') {
      const quantity = parseInt(order.quantity, 10);
      const orgId = order.organization_id;
      const orgSlug = order.org_slug || 'GARAGE';
      const orderPrefix = order.id.slice(0, 4).toUpperCase();

      for (let i = 1; i <= quantity; i++) {
        const token = crypto.randomBytes(8).toString('hex');
        const serialLabel = `${orgSlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${orderPrefix}-${String(i).padStart(4, '0')}`;

        await sql(
          `
          INSERT INTO pvc_cards (organization_id, token, serial_label, status, vehicle_id)
          VALUES ($1, $2, $3, 'unassigned', NULL)
          ON CONFLICT (token) DO NOTHING
        `,
          [orgId, token, serialLabel]
        );
      }

      await logAudit({
        organizationId: orgId,
        userId,
        entityType: 'pvc_cards',
        entityId: orderId,
        action: 'create',
        metadata: {
          action_type: 'auto_generated_from_delivered_order',
          order_id: orderId,
          cards_generated_count: quantity,
        },
      });
    }

    await logAudit({
      organizationId: order.organization_id,
      userId,
      entityType: 'card_orders',
      entityId: orderId,
      action: 'update',
      metadata: {
        previous_status: previousStatus,
        new_status: status,
        tracking_number,
        carrier_name,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Failed to update card order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
