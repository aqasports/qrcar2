import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, NotFoundError } from '@/lib/errors';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'manage_webhooks');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'DELETE',
      path: `/api/public/v1/webhooks/${id}`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const deleteRows = await sql(
      `DELETE FROM webhook_subscriptions 
       WHERE id = $1 AND app_install_id = $2 AND organization_id = $3
       RETURNING id`,
      [id, apiKey.appInstallId, apiKey.organizationId]
    );

    if (deleteRows.length === 0) {
      throw new NotFoundError('Webhook subscription');
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription deleted successfully',
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
