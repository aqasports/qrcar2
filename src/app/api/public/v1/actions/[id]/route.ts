import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, NotFoundError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'read_actions');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: `/api/public/v1/actions/${id}`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const actionRows = await sql(
      `SELECT 
         a.*,
         v.plate_number,
         v.make,
         v.model,
         v.year,
         v.current_mileage as vehicle_current_mileage
       FROM actions a
       JOIN vehicles v ON a.vehicle_id = v.id
       WHERE a.id = $1 AND a.organization_id = $2
       LIMIT 1`,
      [id, apiKey.organizationId]
    );

    if (actionRows.length === 0) {
      throw new NotFoundError('Action');
    }

    const action = actionRows[0];

    // Fetch parts
    const partsRows = await sql(
      `SELECT 
         ap.part_id,
         ap.quantity,
         ap.unit_price_snapshot,
         p.name,
         p.category,
         p.sku,
         p.unit
       FROM action_parts ap
       JOIN parts p ON ap.part_id = p.id
       WHERE ap.action_id = $1`,
      [id]
    );

    // Fetch workers
    const workersRows = await sql(
      `SELECT 
         aw.worker_id,
         aw.role_on_job,
         w.full_name,
         w.role
       FROM action_workers aw
       JOIN workers w ON aw.worker_id = w.id
       WHERE aw.action_id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...action,
        parts: partsRows,
        workers: workersRows,
      },
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
