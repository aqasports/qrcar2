import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, NotFoundError, ValidationError } from '@/lib/errors';
import { emitWebhookEvent } from '@/lib/webhooks';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'write_inventory');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'PATCH',
      path: `/api/public/v1/parts/${id}/stock`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const body = await req.json();
    const { adjustment, reason = 'API inventory adjustment' } = body;

    if (adjustment === undefined || typeof adjustment !== 'number') {
      throw new ValidationError('Numeric field adjustment is required (positive to add, negative to deduct)');
    }

    // Fetch part
    const partRows = await sql(
      `SELECT id, name, sku, quantity_in_stock, min_stock_threshold 
       FROM parts 
       WHERE id = $1 AND organization_id = $2`,
      [id, apiKey.organizationId]
    );

    if (partRows.length === 0) {
      throw new NotFoundError('Part');
    }

    const part = partRows[0];
    const newQuantity = Math.max(0, part.quantity_in_stock + adjustment);
    const movementType = adjustment >= 0 ? 'in' : 'out';

    // Get an admin/owner user ID for created_by
    const userRows = await sql(
      `SELECT user_id FROM organization_members WHERE organization_id = $1 LIMIT 1`,
      [apiKey.organizationId]
    );
    const fallbackUserId = userRows[0]?.user_id;

    // Update stock in DB
    const updatedRows = await sql(
      `UPDATE parts 
       SET quantity_in_stock = $1, updated_at = NOW() 
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [newQuantity, id, apiKey.organizationId]
    );

    // Record stock movement
    if (fallbackUserId) {
      await sql(
        `INSERT INTO stock_movements (organization_id, part_id, type, quantity, reason, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [apiKey.organizationId, id, movementType, Math.abs(adjustment), reason, fallbackUserId]
      );
    }

    const updatedPart = updatedRows[0];

    // Trigger low stock webhook if below threshold
    if (newQuantity <= part.min_stock_threshold) {
      emitWebhookEvent(apiKey.organizationId, 'stock.low', {
        part_id: updatedPart.id,
        name: updatedPart.name,
        sku: updatedPart.sku,
        current_stock: newQuantity,
        min_threshold: part.min_stock_threshold,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPart,
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
