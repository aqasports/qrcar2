import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { verifyChargilyWebhookSignature } from '@/lib/chargily';

// POST /api/webhooks/chargily - Verified Webhook Listener for Chargily Pay (BaridiMob / EDAHABIA / CIB)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('signature') || req.headers.get('x-chargily-signature');

    // Verify signature if secret key is present in environment
    if (process.env.CHARGILY_SECRET_KEY) {
      const isValid = verifyChargilyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('Chargily webhook signature mismatch. Rejecting webhook request.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event || payload.type;
    const checkoutData = payload.data || payload;

    const metadata = checkoutData.metadata || {};
    const organizationId = metadata.organization_id;
    const paymentType = metadata.type; // 'subscription' | 'card_order'

    if (!organizationId) {
      console.warn('Chargily webhook missing organization_id metadata:', checkoutData.id);
      return NextResponse.json({ received: true, warning: 'missing_organization_id' });
    }

    if (eventType === 'checkout.paid' || checkoutData.status === 'paid') {
      if (paymentType === 'subscription') {
        const planId = metadata.plan_id;

        // Calculate next period (30 days)
        const periodEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        if (planId) {
          await sql(
            `
            UPDATE organizations
            SET subscription_status = 'active',
                plan_id = $1,
                current_period_ends_at = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `,
            [planId, periodEndsAt, organizationId]
          );
        } else {
          await sql(
            `
            UPDATE organizations
            SET subscription_status = 'active',
                current_period_ends_at = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `,
            [periodEndsAt, organizationId]
          );
        }

        await logAudit({
          organizationId,
          userId: metadata.user_id || null,
          entityType: 'organizations',
          entityId: organizationId,
          action: 'update',
          metadata: {
            payment_gateway: 'chargily_baridimob',
            checkout_id: checkoutData.id,
            amount: checkoutData.amount,
            plan_slug: metadata.plan_slug,
            subscription_status: 'active',
          },
        });
      } else if (paymentType === 'card_order') {
        const orderId = metadata.card_order_id;
        if (orderId) {
          await sql(
            `
            UPDATE card_orders
            SET status = 'paid',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND organization_id = $2
          `,
            [orderId, organizationId]
          );
        }
      }
    } else if (eventType === 'checkout.failed' || checkoutData.status === 'failed') {
      console.log(`Payment failed for org ${organizationId}, checkout ${checkoutData.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Failed to process Chargily webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
