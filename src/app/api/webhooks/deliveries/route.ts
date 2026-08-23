import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const rows = await sql(
      `SELECT d.id, d.subscription_id, d.event_id, d.topic, d.payload, d.status,
              d.attempts, d.last_attempt_at, d.response_status, d.response_body,
              d.error_message, d.created_at, s.target_url
       FROM webhook_deliveries d
       LEFT JOIN webhook_subscriptions s ON d.subscription_id = s.id
       WHERE d.organization_id = $1
       ORDER BY d.created_at DESC
       LIMIT 50`,
      [orgId]
    );

    return NextResponse.json({
      deliveries: rows.map((r: any) => ({
        id: r.id,
        subscriptionId: r.subscription_id,
        targetUrl: r.target_url || 'Endpoint supprimé',
        eventId: r.event_id,
        topic: r.topic,
        payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
        status: r.status,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        responseStatus: r.response_status,
        responseBody: r.response_body,
        errorMessage: r.error_message,
        createdAt: r.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
