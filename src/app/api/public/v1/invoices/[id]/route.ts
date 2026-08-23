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
    assertScope(apiKey, 'read_invoices');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: `/api/public/v1/invoices/${id}`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const rows = await sql(
      `SELECT 
         i.*,
         a.id as action_id,
         a.type as action_type,
         a.description as action_description,
         a.labor_cost,
         a.mileage_at_service,
         v.plate_number,
         v.make,
         v.model,
         v.year,
         v.vin,
         c.full_name as client_name,
         c.phone as client_phone
       FROM invoices i
       JOIN actions a ON i.action_id = a.id
       JOIN vehicles v ON a.vehicle_id = v.id
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE (i.id = $1 OR i.invoice_number = $1) AND i.organization_id = $2
       LIMIT 1`,
      [id, apiKey.organizationId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Invoice');
    }

    const invoice = rows[0];

    // Fetch line item parts
    const parts = await sql(
      `SELECT 
         ap.part_id,
         ap.quantity,
         ap.unit_price_snapshot,
         p.name,
         p.category,
         p.sku
       FROM action_parts ap
       JOIN parts p ON ap.part_id = p.id
       WHERE ap.action_id = $1`,
      [invoice.action_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        lineItems: {
          parts,
          laborCost: invoice.labor_cost,
        },
      },
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
