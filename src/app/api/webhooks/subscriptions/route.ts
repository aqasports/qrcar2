import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const rows = await sql(
      `SELECT id, target_url, topics, active, secret_hash, created_at, updated_at
       FROM webhook_subscriptions
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [orgId]
    );

    return NextResponse.json({
      subscriptions: rows.map((r: any) => ({
        id: r.id,
        targetUrl: r.target_url,
        topics: typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics,
        active: r.active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const userId = session.user.id;
    const { target_url, topics } = await req.json();

    if (!target_url || !target_url.startsWith('https://')) {
      return NextResponse.json({ error: 'URL de webhook HTTPS requise' }, { status: 400 });
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'Au moins un événement (topic) doit être sélectionné' }, { status: 400 });
    }

    // Generate secret
    const rawSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const rows = await sql(
      `INSERT INTO webhook_subscriptions (organization_id, target_url, topics, secret_hash, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [orgId, target_url, JSON.stringify(topics), secretHash]
    );

    const subscription = rows[0];

    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'webhook_subscription',
      entityId: subscription.id,
      action: 'create',
      metadata: { target_url, topics },
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        targetUrl: subscription.target_url,
        topics: JSON.parse(subscription.topics),
        active: subscription.active,
        signingSecret: rawSecret, // Revealed only once
        createdAt: subscription.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
