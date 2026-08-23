import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'read_invoices');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/invoices',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.subtotal,
        i.tax_amount,
        i.total,
        i.status,
        i.created_at,
        i.updated_at,
        a.id as action_id,
        a.type as action_type,
        a.description as action_description,
        v.plate_number,
        v.make,
        v.model,
        c.full_name as client_name
      FROM invoices i
      JOIN actions a ON i.action_id = a.id
      JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE i.organization_id = $1
    `;
    const params: any[] = [apiKey.organizationId];

    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await sql(query, params);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
