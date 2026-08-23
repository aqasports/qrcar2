import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey, assertScope } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { formatErrorResponse, RateLimitError, ValidationError } from '@/lib/errors';
import { emitWebhookEvent } from '@/lib/webhooks';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);
    assertScope(apiKey, 'read_vehicles');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/vehicles',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let query = `
      SELECT 
        v.id,
        v.client_id,
        v.plate_number,
        v.make,
        v.model,
        v.year,
        v.vin,
        v.color,
        v.current_mileage,
        v.fuel_type,
        v.transmission,
        v.engine_spec,
        v.oil_type,
        v.tire_size,
        v.next_service_mileage,
        v.next_service_date,
        v.next_inspection_date,
        v.created_at,
        v.updated_at,
        c.full_name as client_name,
        pc.token as pvc_token,
        pc.status as pvc_status
      FROM vehicles v
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN pvc_cards pc ON v.id = pc.vehicle_id AND pc.status = 'active'
      WHERE v.organization_id = $1
    `;
    const params: any[] = [apiKey.organizationId];

    if (clientId) {
      params.push(clientId);
      query += ` AND v.client_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (v.plate_number ILIKE $${params.length} OR v.make ILIKE $${params.length} OR v.model ILIKE $${params.length} OR v.vin ILIKE $${params.length})`;
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await sql(query, params);

    const countRows = await sql(
      `SELECT count(*) as total FROM vehicles WHERE organization_id = $1`,
      [apiKey.organizationId]
    );
    const total = parseInt(countRows[0]?.total || '0', 10);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
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
    assertScope(apiKey, 'write_vehicles');

    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'POST',
      path: '/api/public/v1/vehicles',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const body = await req.json();
    const {
      plateNumber,
      make,
      model,
      year,
      clientId,
      vin,
      color,
      currentMileage = 0,
      fuelType = 'Diesel',
      transmission = 'Manuelle',
      engineSpec,
      oilType = '5W-30 ACEA C3',
      tireSize,
      nextServiceMileage,
      nextServiceDate,
      nextInspectionDate,
    } = body;

    if (!plateNumber || !make || !model || !year) {
      throw new ValidationError('Fields plateNumber, make, model, and year are required');
    }

    // Verify client exists if clientId provided
    if (clientId) {
      const clientCheck = await sql(
        `SELECT id FROM clients WHERE id = $1 AND organization_id = $2`,
        [clientId, apiKey.organizationId]
      );
      if (clientCheck.length === 0) {
        throw new ValidationError('Invalid clientId: client not found in this organization');
      }
    }

    const insertRows = await sql(
      `INSERT INTO vehicles (
         organization_id,
         client_id,
         plate_number,
         make,
         model,
         year,
         vin,
         color,
         current_mileage,
         fuel_type,
         transmission,
         engine_spec,
         oil_type,
         tire_size,
         next_service_mileage,
         next_service_date,
         next_inspection_date,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
       RETURNING *`,
      [
        apiKey.organizationId,
        clientId || null,
        plateNumber.trim().toUpperCase(),
        make.trim(),
        model.trim(),
        parseInt(year, 10),
        vin ? vin.trim().toUpperCase() : null,
        color || null,
        parseInt(currentMileage, 10) || 0,
        fuelType,
        transmission,
        engineSpec || null,
        oilType,
        tireSize || null,
        nextServiceMileage ? parseInt(nextServiceMileage, 10) : null,
        nextServiceDate || null,
        nextInspectionDate || null,
      ]
    );

    const newVehicle = insertRows[0];

    // Emit Webhook Event
    emitWebhookEvent(apiKey.organizationId, 'vehicle.created', {
      vehicle_id: newVehicle.id,
      plate_number: newVehicle.plate_number,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      client_id: newVehicle.client_id,
    });

    return NextResponse.json({
      success: true,
      data: newVehicle,
    }, { status: 201 });
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
