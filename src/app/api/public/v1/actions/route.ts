import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, ValidationError, NotFoundError } from '@/lib/errors';
import { emitWebhookEvent } from '@/lib/webhooks';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'read_actions');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/actions',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId') || '';
    const status = searchParams.get('status') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let query = `
      SELECT 
        a.id,
        a.vehicle_id,
        a.type,
        a.description,
        a.client_visible_notes,
        a.mileage_at_service,
        a.status,
        a.date_in,
        a.date_out,
        a.labor_cost,
        a.created_at,
        v.plate_number,
        v.make,
        v.model
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.organization_id = $1
    `;
    const params: any[] = [apiKey.organizationId];

    if (vehicleId) {
      params.push(vehicleId);
      query += ` AND a.vehicle_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    query += ` ORDER BY a.date_in DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'write_actions');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'POST',
      path: '/api/public/v1/actions',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const body = await req.json();
    const {
      vehicleId,
      type = 'maintenance',
      description,
      clientVisibleNotes,
      internalNotes,
      mileageAtService,
      laborCost = 0,
      parts = [], // array of { partId, quantity }
    } = body;

    if (!vehicleId || !description || mileageAtService === undefined) {
      throw new ValidationError('Fields vehicleId, description, and mileageAtService are required');
    }

    // Verify vehicle belongs to org
    const vCheck = await sql(
      `SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2`,
      [vehicleId, apiKey.organizationId]
    );
    if (vCheck.length === 0) {
      throw new NotFoundError('Vehicle');
    }

    // Get an admin/owner user ID for the organization to associate created_by
    const userRows = await sql(
      `SELECT user_id FROM organization_members WHERE organization_id = $1 LIMIT 1`,
      [apiKey.organizationId]
    );
    const fallbackUserId = userRows[0]?.user_id;

    if (!fallbackUserId) {
      throw new ValidationError('No valid organization user found to associate with action');
    }

    // Insert action
    const actionRows = await sql(
      `INSERT INTO actions (
         organization_id,
         vehicle_id,
         type,
         description,
         client_visible_notes,
         internal_notes,
         mileage_at_service,
         status,
         labor_cost,
         created_by,
         date_in,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, NOW(), NOW(), NOW())
       RETURNING *`,
      [
        apiKey.organizationId,
        vehicleId,
        type,
        description,
        clientVisibleNotes || null,
        internalNotes || null,
        parseInt(mileageAtService, 10),
        laborCost.toString(),
        fallbackUserId,
      ]
    );

    const action = actionRows[0];

    // Handle atomic parts deduction if provided
    if (Array.isArray(parts) && parts.length > 0) {
      for (const item of parts) {
        if (!item.partId || !item.quantity) continue;
        const partRows = await sql(
          `SELECT sale_price, quantity_in_stock FROM parts WHERE id = $1 AND organization_id = $2`,
          [item.partId, apiKey.organizationId]
        );
        if (partRows.length > 0) {
          const salePrice = partRows[0].sale_price;
          // Insert action part
          await sql(
            `INSERT INTO action_parts (action_id, part_id, quantity, unit_price_snapshot, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [action.id, item.partId, item.quantity, salePrice]
          );
          // Decrement stock
          await sql(
            `UPDATE parts SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 AND organization_id = $3`,
            [item.quantity, item.partId, apiKey.organizationId]
          );
          // Log stock movement
          await sql(
            `INSERT INTO stock_movements (organization_id, part_id, reference_action_id, type, quantity, reason, created_by, created_at)
             VALUES ($1, $2, $3, 'out', $4, 'Public API Work Order', $5, NOW())`,
            [apiKey.organizationId, item.partId, action.id, item.quantity, fallbackUserId]
          );
        }
      }
    }

    // Update vehicle current mileage
    await sql(
      `UPDATE vehicles 
       SET current_mileage = GREATEST(current_mileage, $1), updated_at = NOW() 
       WHERE id = $2 AND organization_id = $3`,
      [parseInt(mileageAtService, 10), vehicleId, apiKey.organizationId]
    );

    // Emit Webhook Event
    emitWebhookEvent(apiKey.organizationId, 'action.created', {
      action_id: action.id,
      vehicle_id: vehicleId,
      type: action.type,
      description: action.description,
      mileage: action.mileage_at_service,
      status: action.status,
    });

    return NextResponse.json({
      success: true,
      data: action,
    }, { status: 201 });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
