import { NextRequest, NextResponse } from 'next/server';
import { graphql, buildSchema } from 'graphql';
import { resolveApiKey, assertScope, ResolvedApiKey } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { sql } from '@/lib/db';
import { emitWebhookEvent } from '@/lib/webhooks';
import { formatErrorResponse, RateLimitError } from '@/lib/errors';

const schema = buildSchema(`
  type Organization {
    id: ID!
    name: String!
    slug: String!
    subscriptionStatus: String!
    plan: String!
  }

  type ApiCallerInfo {
    id: ID!
    prefix: String!
    appName: String!
    scopes: [String!]!
    organization: Organization!
  }

  type Vehicle {
    id: ID!
    plateNumber: String!
    make: String!
    model: String!
    year: Int!
    vin: String
    color: String
    currentMileage: Int!
    fuelType: String
    transmission: String
    engineSpec: String
    oilType: String
    nextServiceMileage: Int
    nextServiceDate: String
    createdAt: String!
  }

  type ActionPart {
    partId: ID!
    quantity: Int!
    unitPriceSnapshot: Float!
    name: String
    category: String
    sku: String
  }

  type Action {
    id: ID!
    vehicleId: ID!
    type: String!
    description: String!
    clientVisibleNotes: String
    mileageAtService: Int!
    status: String!
    dateIn: String!
    dateOut: String
    laborCost: Float!
    parts: [ActionPart!]
  }

  type Part {
    id: ID!
    name: String!
    category: String!
    sku: String!
    unit: String!
    salePrice: Float!
    quantityInStock: Int!
    minStockThreshold: Int!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    subtotal: Float!
    taxAmount: Float!
    total: Float!
    status: String!
    createdAt: String!
  }

  input CreateVehicleInput {
    plateNumber: String!
    make: String!
    model: String!
    year: Int!
    vin: String
    color: String
    currentMileage: Int
    fuelType: String
    transmission: String
  }

  input CreateActionInput {
    vehicleId: ID!
    type: String
    description: String!
    mileageAtService: Int!
    laborCost: Float
    clientVisibleNotes: String
  }

  type Query {
    me: ApiCallerInfo!
    vehicles(search: String, limit: Int, offset: Int): [Vehicle!]!
    vehicle(id: ID!): Vehicle
    actions(vehicleId: ID, status: String, limit: Int, offset: Int): [Action!]!
    action(id: ID!): Action
    parts(search: String, category: String, lowStockOnly: Boolean, limit: Int, offset: Int): [Part!]!
    invoices(status: String, limit: Int, offset: Int): [Invoice!]!
  }

  type Mutation {
    createVehicle(input: CreateVehicleInput!): Vehicle!
    createAction(input: CreateActionInput!): Action!
    completeAction(id: ID!): Action!
    adjustPartStock(partId: ID!, adjustment: Int!, reason: String): Part!
  }
`);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);

    // Rate Limiting
    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'POST',
      path: '/api/public/v1/graphql',
      limit: apiKey.rateLimitPerMinute,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const { query, variables } = await req.json();

    if (!query) {
      return NextResponse.json({ errors: [{ message: 'Missing GraphQL query string' }] }, { status: 400 });
    }

    const rootValue = {
      me: () => ({
        id: apiKey.apiKeyId,
        prefix: apiKey.keyPrefix,
        appName: apiKey.appName,
        scopes: apiKey.scopes,
        organization: {
          id: apiKey.organizationId,
          name: apiKey.orgName,
          slug: apiKey.orgSlug,
          subscriptionStatus: apiKey.subscriptionStatus,
          plan: apiKey.planSlug,
        },
      }),

      vehicles: async ({ search = '', limit = 50, offset = 0 }: any) => {
        assertScope(apiKey, 'read_vehicles');
        let sqlQuery = `SELECT * FROM vehicles WHERE organization_id = $1`;
        const params: any[] = [apiKey.organizationId];
        if (search) {
          params.push(`%${search}%`);
          sqlQuery += ` AND (plate_number ILIKE $${params.length} OR make ILIKE $${params.length} OR model ILIKE $${params.length})`;
        }
        sqlQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Math.min(100, limit), offset);

        const rows = await sql(sqlQuery, params);
        return rows.map((r: any) => ({
          id: r.id,
          plateNumber: r.plate_number,
          make: r.make,
          model: r.model,
          year: r.year,
          vin: r.vin,
          color: r.color,
          currentMileage: r.current_mileage,
          fuelType: r.fuel_type,
          transmission: r.transmission,
          engineSpec: r.engine_spec,
          oilType: r.oil_type,
          nextServiceMileage: r.next_service_mileage,
          nextServiceDate: r.next_service_date,
          createdAt: r.created_at,
        }));
      },

      vehicle: async ({ id }: any) => {
        assertScope(apiKey, 'read_vehicles');
        const rows = await sql(`SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1`, [id, apiKey.organizationId]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
          id: r.id,
          plateNumber: r.plate_number,
          make: r.make,
          model: r.model,
          year: r.year,
          vin: r.vin,
          color: r.color,
          currentMileage: r.current_mileage,
          fuelType: r.fuel_type,
          transmission: r.transmission,
          engineSpec: r.engine_spec,
          oilType: r.oil_type,
          nextServiceMileage: r.next_service_mileage,
          nextServiceDate: r.next_service_date,
          createdAt: r.created_at,
        };
      },

      actions: async ({ vehicleId, status, limit = 50, offset = 0 }: any) => {
        assertScope(apiKey, 'read_actions');
        let sqlQuery = `SELECT * FROM actions WHERE organization_id = $1`;
        const params: any[] = [apiKey.organizationId];
        if (vehicleId) {
          params.push(vehicleId);
          sqlQuery += ` AND vehicle_id = $${params.length}`;
        }
        if (status) {
          params.push(status);
          sqlQuery += ` AND status = $${params.length}`;
        }
        sqlQuery += ` ORDER BY date_in DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Math.min(100, limit), offset);

        const rows = await sql(sqlQuery, params);
        return rows.map((r: any) => ({
          id: r.id,
          vehicleId: r.vehicle_id,
          type: r.type,
          description: r.description,
          clientVisibleNotes: r.client_visible_notes,
          mileageAtService: r.mileage_at_service,
          status: r.status,
          dateIn: r.date_in,
          dateOut: r.date_out,
          laborCost: parseFloat(r.labor_cost || '0'),
        }));
      },

      parts: async ({ search = '', category = '', lowStockOnly = false, limit = 50, offset = 0 }: any) => {
        assertScope(apiKey, 'read_inventory');
        let sqlQuery = `SELECT * FROM parts WHERE organization_id = $1 AND active = true`;
        const params: any[] = [apiKey.organizationId];
        if (category) {
          params.push(category);
          sqlQuery += ` AND category = $${params.length}`;
        }
        if (lowStockOnly) {
          sqlQuery += ` AND quantity_in_stock <= min_stock_threshold`;
        }
        if (search) {
          params.push(`%${search}%`);
          sqlQuery += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
        }
        sqlQuery += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Math.min(100, limit), offset);

        const rows = await sql(sqlQuery, params);
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          sku: r.sku,
          unit: r.unit,
          salePrice: parseFloat(r.sale_price || '0'),
          quantityInStock: r.quantity_in_stock,
          minStockThreshold: r.min_stock_threshold,
        }));
      },

      invoices: async ({ status = '', limit = 50, offset = 0 }: any) => {
        assertScope(apiKey, 'read_invoices');
        let sqlQuery = `SELECT * FROM invoices WHERE organization_id = $1`;
        const params: any[] = [apiKey.organizationId];
        if (status) {
          params.push(status);
          sqlQuery += ` AND status = $${params.length}`;
        }
        sqlQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Math.min(100, limit), offset);

        const rows = await sql(sqlQuery, params);
        return rows.map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoice_number,
          subtotal: parseFloat(r.subtotal || '0'),
          taxAmount: parseFloat(r.tax_amount || '0'),
          total: parseFloat(r.total || '0'),
          status: r.status,
          createdAt: r.created_at,
        }));
      },

      createVehicle: async ({ input }: any) => {
        assertScope(apiKey, 'write_vehicles');
        const rows = await sql(
          `INSERT INTO vehicles (organization_id, plate_number, make, model, year, vin, color, current_mileage, fuel_type, transmission, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING *`,
          [
            apiKey.organizationId,
            input.plateNumber.toUpperCase(),
            input.make,
            input.model,
            input.year,
            input.vin || null,
            input.color || null,
            input.currentMileage || 0,
            input.fuelType || 'Diesel',
            input.transmission || 'Manuelle',
          ]
        );
        const r = rows[0];
        emitWebhookEvent(apiKey.organizationId, 'vehicle.created', {
          vehicle_id: r.id,
          plate_number: r.plate_number,
          make: r.make,
          model: r.model,
        });
        return {
          id: r.id,
          plateNumber: r.plate_number,
          make: r.make,
          model: r.model,
          year: r.year,
          vin: r.vin,
          color: r.color,
          currentMileage: r.current_mileage,
          fuelType: r.fuel_type,
          transmission: r.transmission,
          createdAt: r.created_at,
        };
      },

      completeAction: async ({ id }: any) => {
        assertScope(apiKey, 'write_actions');
        const rows = await sql(
          `UPDATE actions SET status = 'completed', date_out = NOW(), updated_at = NOW()
           WHERE id = $1 AND organization_id = $2
           RETURNING *`,
          [id, apiKey.organizationId]
        );
        if (rows.length === 0) throw new Error('Action not found');
        const r = rows[0];
        emitWebhookEvent(apiKey.organizationId, 'action.completed', {
          action_id: r.id,
          vehicle_id: r.vehicle_id,
          status: 'completed',
        });
        return {
          id: r.id,
          vehicleId: r.vehicle_id,
          type: r.type,
          description: r.description,
          mileageAtService: r.mileage_at_service,
          status: r.status,
          dateIn: r.date_in,
          dateOut: r.date_out,
          laborCost: parseFloat(r.labor_cost || '0'),
        };
      },
    };

    const response = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
