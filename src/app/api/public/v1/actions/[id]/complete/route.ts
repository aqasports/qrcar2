import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, NotFoundError } from '@/lib/errors';
import { emitWebhookEvent } from '@/lib/webhooks';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'write_actions');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'POST',
      path: `/api/public/v1/actions/${id}/complete`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const updatedRows = await sql(
      `UPDATE actions 
       SET status = 'completed', date_out = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [id, apiKey.organizationId]
    );

    if (updatedRows.length === 0) {
      throw new NotFoundError('Action');
    }

    const action = updatedRows[0];

    // Emit Webhook Event
    emitWebhookEvent(apiKey.organizationId, 'action.completed', {
      action_id: action.id,
      vehicle_id: action.vehicle_id,
      type: action.type,
      description: action.description,
      mileage: action.mileage_at_service,
      date_out: action.date_out,
      labor_cost: action.labor_cost,
    });

    return NextResponse.json({
      success: true,
      data: action,
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
