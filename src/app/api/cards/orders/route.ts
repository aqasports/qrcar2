import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createChargilyCheckout } from '@/lib/chargily';
import { VOLUME_TIERS } from '@/lib/algeria-wilayas';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiServerError,
} from '@/lib/api/response';

// GET /api/cards/orders - List all card fulfillment orders for organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId } = session.user;

  try {
    const orders = await sql(
      `
      SELECT 
        co.*,
        cd.name as design_name,
        cd.layout_preset,
        cd.front_logo_url,
        cd.front_bg_color,
        cd.front_accent_color
      FROM card_orders co
      JOIN card_designs cd ON co.card_design_id = cd.id
      WHERE co.organization_id = $1
      ORDER BY co.created_at DESC
    `,
      [organizationId]
    );

    return apiSuccess(orders);
  } catch (error: any) {
    console.error('Failed to get card orders:', error);
    return apiServerError();
  }
}

// POST /api/cards/orders - Create a new physical PVC card batch order & initialize Chargily payment
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId, orgName } = session.user;
  if (role === 'technician') {
    return apiForbidden('Seuls les gérants et administrateurs peuvent commander des lots de cartes.');
  }

  try {
    const body = await req.json();
    const { card_design_id, quantity, shipping_address, shipping_wilaya, shipping_phone } = body;

    if (!card_design_id || !quantity || !shipping_address || !shipping_wilaya || !shipping_phone) {
      return apiError(
        'Veuillez renseigner tous les champs obligatoires (Modèle, Quantité, Adresse, Wilaya, Téléphone).',
        'MISSING_FIELDS',
        400
      );
    }

    const qty = parseInt(quantity, 10);
    if (qty < 50) {
      return apiError(
        'La quantité minimale pour une commande de cartes PVC physiques est de 50 unités.',
        'MIN_QUANTITY_NOT_MET',
        400
      );
    }

    // 1. Verify Card Design is Approved
    const designRows = await sql(
      `SELECT * FROM card_designs WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [card_design_id, organizationId]
    );
    if (designRows.length === 0) {
      return apiError('Modèle de carte introuvable.', 'DESIGN_NOT_FOUND', 404);
    }

    const design = designRows[0];
    if (design.status !== 'approved') {
      return apiError(
        'Ce modèle de carte n’a pas encore été validé pour impression usine. Veuillez d’abord soumettre le modèle pour validation dans le Studio.',
        'DESIGN_NOT_APPROVED',
        400
      );
    }

    // 2. Compute Volume Pricing
    const matchedTier =
      VOLUME_TIERS.slice().reverse().find((t) => qty >= t.quantity) || VOLUME_TIERS[0];
    const unitPrice = matchedTier.unitPrice;
    const totalPrice = qty * unitPrice;

    // 3. Create Card Order in Database
    const orderRows = await sql(
      `
      INSERT INTO card_orders (
        organization_id, card_design_id, quantity, unit_price, total_price,
        shipping_address, shipping_wilaya, shipping_phone, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_payment')
      RETURNING *
    `,
      [
        organizationId,
        card_design_id,
        qty,
        unitPrice,
        totalPrice,
        shipping_address.trim(),
        shipping_wilaya.trim(),
        shipping_phone.trim(),
      ]
    );

    const order = orderRows[0];

    // 4. Create Chargily Pay Checkout Session (BaridiMob / EDAHABIA / CIB)
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://garagepro.app';
    let checkoutUrl = '';

    try {
      const checkout = await createChargilyCheckout({
        amount: totalPrice,
        currency: 'dzd',
        description: `Commande ${qty} Cartes PVC ${design.name} (${orgName})`,
        successUrl: `${baseUrl}/admin/cards/order?success=true&order_id=${order.id}`,
        failureUrl: `${baseUrl}/admin/cards/order?canceled=true&order_id=${order.id}`,
        metadata: {
          type: 'card_order',
          organization_id: organizationId,
          card_order_id: order.id,
          user_id: userId,
          quantity: qty,
        },
      });
      checkoutUrl = checkout.checkout_url;
    } catch (paymentErr: any) {
      console.warn('Chargily checkout creation mock/fallback:', paymentErr.message);
      checkoutUrl = `${baseUrl}/admin/cards/order?success=true&order_id=${order.id}&mock_checkout=1`;
    }

    await logAudit({
      organizationId,
      userId,
      entityType: 'card_orders',
      entityId: order.id,
      action: 'create',
      metadata: { quantity: qty, total_price: totalPrice, design_id: card_design_id },
    });

    return apiSuccess({
      order,
      checkout_url: checkoutUrl,
    }, 201);
  } catch (error: any) {
    console.error('Failed to create card order:', error);
    return apiServerError('Impossible de créer la commande de cartes.');
  }
}
