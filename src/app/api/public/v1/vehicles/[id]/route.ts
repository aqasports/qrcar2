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
    assertScope(apiKey, 'read_vehicles');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: `/api/public/v1/vehicles/${id}`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const rows = await sql(
      `SELECT 
         v.*,
         c.full_name as client_name,
         pc.token as pvc_token,
         pc.status as pvc_status,
         pc.serial_label as pvc_serial_label
       FROM vehicles v
       LEFT JOIN clients c ON v.client_id = c.id
       LEFT JOIN pvc_cards pc ON v.id = pc.vehicle_id AND pc.status = 'active'
       WHERE v.id = $1 AND v.organization_id = $2
       LIMIT 1`,
      [id, apiKey.organizationId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Vehicle');
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'write_vehicles');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'PATCH',
      path: `/api/public/v1/vehicles/${id}`,
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const body = await req.json();
    const allowedUpdates = [
      'make', 'model', 'year', 'color', 'currentMileage',
      'fuelType', 'transmission', 'engineSpec', 'oilType', 'tireSize',
      'nextServiceMileage', 'nextServiceDate', 'nextInspectionDate'
    ];

    const updates: string[] = [];
    const values: any[] = [id, apiKey.organizationId];

    for (const [key, value] of Object.entries(body)) {
      if (!allowedUpdates.includes(key)) continue;

      let colName = key;
      if (key === 'currentMileage') colName = 'current_mileage';
      else if (key === 'fuelType') colName = 'fuel_type';
      else if (key === 'engineSpec') colName = 'engine_spec';
      else if (key === 'oilType') colName = 'oil_type';
      else if (key === 'tireSize') colName = 'tire_size';
      else if (key === 'nextServiceMileage') colName = 'next_service_mileage';
      else if (key === 'nextServiceDate') colName = 'next_service_date';
      else if (key === 'nextInspectionDate') colName = 'next_inspection_date';

      values.push(value);
      updates.push(`${colName} = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'No updates applied' });
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE vehicles 
      SET ${updates.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `;

    const updatedRows = await sql(query, values);
    if (updatedRows.length === 0) {
      throw new NotFoundError('Vehicle');
    }

    return NextResponse.json({
      success: true,
      data: updatedRows[0],
    });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
