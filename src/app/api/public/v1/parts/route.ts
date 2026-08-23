import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'read_inventory');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/parts',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.sku,
        p.unit,
        p.sale_price,
        p.purchase_price,
        p.quantity_in_stock,
        p.min_stock_threshold,
        p.active,
        p.created_at,
        s.name as supplier_name
      FROM parts p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.organization_id = $1 AND p.active = true
    `;
    const params: any[] = [apiKey.organizationId];

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (lowStockOnly) {
      query += ` AND p.quantity_in_stock <= p.min_stock_threshold`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
