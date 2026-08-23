import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, ValidationError } from '@/lib/errors';
import { WebhookTopic } from '@/lib/webhooks';

const VALID_TOPICS: WebhookTopic[] = [
  'vehicle.created',
  'client.created',
  'action.created',
  'action.completed',
  'invoice.issued',
  'card.linked',
  'card.revoked',
  'stock.low',
  'appointment.created',
  'appointment.cancelled',
];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'manage_webhooks');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/webhooks',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const rows = await sql(
      `SELECT 
         id,
         topic,
         target_url,
         active,
         created_at,
         updated_at
       FROM webhook_subscriptions
       WHERE app_install_id = $1 AND organization_id = $2`,
      [apiKey.appInstallId, apiKey.organizationId]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'manage_webhooks');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'POST',
      path: '/api/public/v1/webhooks',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const body = await req.json();
    const { topic, targetUrl } = body;

    if (!topic || !targetUrl) {
      throw new ValidationError('Fields topic and targetUrl are required');
    }

    if (!VALID_TOPICS.includes(topic)) {
      throw new ValidationError(`Invalid topic. Valid topics are: ${VALID_TOPICS.join(', ')}`);
    }

    try {
      new URL(targetUrl);
    } catch {
      throw new ValidationError('Invalid targetUrl format');
    }

    // Generate random cryptographic signing secret
    const signingSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const insertRows = await sql(
      `INSERT INTO webhook_subscriptions (
         app_install_id,
         organization_id,
         topic,
         target_url,
         signing_secret,
         active,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, topic, target_url, active, created_at`,
      [apiKey.appInstallId, apiKey.organizationId, topic, targetUrl, signingSecret]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...insertRows[0],
        signingSecret, // Revealed only once upon creation
      },
    }, { status: 201 });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
