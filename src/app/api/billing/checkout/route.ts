import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { createChargilyCheckout } from '@/lib/chargily';

// POST /api/billing/checkout - Create a Chargily Pay checkout session for subscription upgrade/renewal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId, orgName } = session.user;
  if (role !== 'owner' && role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Seuls les propriétaires et administrateurs peuvent gérer l’abonnement.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { plan_slug } = body;

    if (!plan_slug) {
      return NextResponse.json({ error: 'Plan slug is required' }, { status: 400 });
    }

    // 1. Fetch target plan
    const planRows = await sql(`SELECT * FROM plans WHERE slug = $1 AND active = true LIMIT 1`, [
      plan_slug,
    ]);
    if (planRows.length === 0) {
      return NextResponse.json({ error: 'Forfait introuvable' }, { status: 404 });
    }

    const plan = planRows[0];
    const amount = parseFloat(plan.price_monthly);

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant du forfait doit être supérieur à 0' }, { status: 400 });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://garage-pro.netlify.app';

    // 2. Create Chargily Checkout Session
    const checkout = await createChargilyCheckout({
      amount,
      currency: 'dzd',
      description: `Abonnement Garage SaaS - Forfait ${plan.name} (${orgName})`,
      successUrl: `${baseUrl}/admin/billing?success=true`,
      failureUrl: `${baseUrl}/admin/billing?canceled=true`,
      metadata: {
        organization_id: organizationId,
        user_id: userId,
        plan_id: plan.id,
        plan_slug: plan.slug,
        type: 'subscription',
      },
    });

    return NextResponse.json({
      checkout_url: checkout.checkout_url,
      checkout_id: checkout.id,
    });
  } catch (error: any) {
    console.error('Failed to create billing checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Échec de la création de la session de paiement Chargily.' },
      { status: 500 }
    );
  }
}
