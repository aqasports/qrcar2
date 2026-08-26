import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createActionSchema, validateRequestBody } from '@/lib/validation/schemas';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from '@/lib/api/response';
import crypto from 'crypto';

// GET /api/actions - List service actions scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicle_id') || '';

  try {
    let actions = [];

    if (role === 'technician') {
      const workerRows = await sql(
        `SELECT id FROM workers WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
        [userId, organizationId]
      );
      if (workerRows.length === 0) {
        return apiSuccess([]);
      }
      const workerId = workerRows[0].id;

      // Technicians only see actions they are assigned to within their organization
      let query = `
        SELECT DISTINCT 
          a.*,
          v.plate_number, v.make, v.model, v.vin,
          COALESCE(c.full_name, 'Stock / Non assigné') as client_name,
          rot.name as template_name,
          COALESCE((SELECT SUM(roi.unit_price * roi.quantity) FROM repair_order_items roi WHERE roi.action_id = a.id), 0) as items_total
        FROM actions a
        JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
        LEFT JOIN clients c ON v.client_id = c.id
        LEFT JOIN repair_order_templates rot ON rot.id = a.template_id
        JOIN action_workers aw ON aw.action_id = a.id
        WHERE a.organization_id = $1 AND aw.worker_id = $2
      `;
      const params = [organizationId, workerId];
      if (vehicleId) {
        query += ` AND a.vehicle_id = $3`;
        params.push(vehicleId);
      }
      query += ` ORDER BY a.date_in DESC`;
      actions = await sql(query, params);
    } else {
      // Owners, Admins, and Managers see all actions in their organization
      let query = `
        SELECT 
          a.*,
          v.plate_number, v.make, v.model, v.vin,
          COALESCE(c.full_name, 'Stock / Non assigné') as client_name,
          rot.name as template_name,
          COALESCE((SELECT SUM(roi.unit_price * roi.quantity) FROM repair_order_items roi WHERE roi.action_id = a.id), 0) as items_total
        FROM actions a
        JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
        LEFT JOIN clients c ON v.client_id = c.id
        LEFT JOIN repair_order_templates rot ON rot.id = a.template_id
        WHERE a.organization_id = $1
      `;
      const params = [organizationId];
      if (vehicleId) {
        query += ` AND a.vehicle_id = $2`;
        params.push(vehicleId);
      }
      query += ` ORDER BY a.date_in DESC`;
      actions = await sql(query, params);
    }

    const formatted = actions.map((a: any) => ({
      ...a,
      labor_cost: parseFloat(a.labor_cost || '0'),
      has_tax: a.has_tax !== false && a.has_tax !== 0,
      tax_rate: parseFloat(a.tax_rate || '19.00'),
      items_total: parseFloat(a.items_total || '0'),
      quality_checkpoints: typeof a.quality_checkpoints === 'string' ? JSON.parse(a.quality_checkpoints) : (a.quality_checkpoints || []),
    }));

    return apiSuccess(formatted);
  } catch (error) {
    console.error('Failed to get actions:', error);
    return apiServerError();
  }
}

// POST /api/actions - Create action scoped to organization with customizable items & tax toggle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { id: userId, organizationId } = session.user;

  try {
    const rawBody = await req.json();

    const {
      vehicle_id,
      type = 'repair',
      description,
      client_visible_notes,
      internal_notes,
      mileage_at_service,
      status = 'open',
      labor_cost = 0,
      has_tax = true,
      tax_rate = 19.00,
      template_id,
      quality_checkpoints = [],
      workers = [],
      items = [],
    } = rawBody;

    if (!vehicle_id) {
      return apiError('Le véhicule est obligatoire.', 'VALIDATION_ERROR', 400);
    }
    if (!description || !description.trim()) {
      return apiError('La désignation des travaux est obligatoire.', 'VALIDATION_ERROR', 400);
    }

    const mileage = mileage_at_service !== undefined ? parseInt(String(mileage_at_service), 10) : 0;
    const labor = parseFloat(String(labor_cost)) || 0.0;
    const isTaxEnabled = Boolean(has_tax);
    const finalTaxRate = isTaxEnabled ? (parseFloat(String(tax_rate)) || 19.00) : 0.00;

    // 1. Verify vehicle belongs to this organization
    const vehicleCheck = await sql(
      `SELECT id, current_mileage FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [vehicle_id, organizationId]
    );
    if (vehicleCheck.length === 0) {
      return apiError('Véhicule introuvable.', 'VEHICLE_NOT_FOUND', 404);
    }

    const actionId = crypto.randomUUID();

    // 2. Insert action with organization_id
    await sql(
      `
      INSERT INTO actions (
        id, organization_id, vehicle_id, type, description,
        client_visible_notes, internal_notes, mileage_at_service,
        status, labor_cost, has_tax, tax_rate, template_id,
        quality_checkpoints, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `,
      [
        actionId,
        organizationId,
        vehicle_id,
        type,
        description.trim(),
        client_visible_notes ? client_visible_notes.trim() : null,
        internal_notes ? internal_notes.trim() : null,
        mileage,
        status || 'open',
        labor,
        isTaxEnabled ? 1 : 0,
        finalTaxRate,
        template_id || null,
        JSON.stringify(quality_checkpoints || []),
        userId,
      ]
    );

    // 3. Insert customized line items (repair_order_items) & handle stock movements for inventory parts
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = crypto.randomUUID();
        const itemQty = parseFloat(String(item.quantity)) || 1;
        const itemPrice = parseFloat(String(item.unit_price)) || 0;

        let snapshotPrice: number | null = null;

        if (item.linked_part_id) {
          // Check catalog part in this org
          const partRows = await sql(
            `SELECT id, sale_price, quantity_in_stock FROM parts WHERE id = $1 AND organization_id = $2 LIMIT 1`,
            [item.linked_part_id, organizationId]
          );

          if (partRows.length > 0) {
            const part = partRows[0];
            snapshotPrice = parseFloat(part.sale_price || '0');

            // Decrement inventory stock atomically
            await sql(
              `UPDATE parts SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 AND organization_id = $3`,
              [Math.round(itemQty), part.id, organizationId]
            );

            // Log stock movement
            const movementId = crypto.randomUUID();
            await sql(
              `
              INSERT INTO stock_movements (id, organization_id, part_id, reference_action_id, action_id, type, quantity, reason, created_by)
              VALUES ($1, $2, $3, $4, $5, 'out', $6, $7, $8)
            `,
              [
                movementId,
                organizationId,
                part.id,
                actionId,
                actionId,
                Math.round(itemQty),
                `Utilisation Ordre de Réparation #${actionId.slice(0, 8)}`,
                userId,
              ]
            );

            // Also keep action_parts in sync
            await sql(
              `
              INSERT INTO action_parts (action_id, part_id, quantity, unit_price_snapshot)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (action_id, part_id) DO UPDATE SET
                quantity = action_parts.quantity + EXCLUDED.quantity,
                unit_price_snapshot = EXCLUDED.unit_price_snapshot
            `,
              [actionId, part.id, Math.round(itemQty), snapshotPrice]
            );
          }
        }

        // Insert into repair_order_items
        await sql(
          `
          INSERT INTO repair_order_items (
            id, action_id, name, description, item_type,
            quantity, unit_price, unit, linked_part_id,
            unit_price_snapshot, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
          [
            itemId,
            actionId,
            item.name?.trim() || 'Prestation atelier',
            item.description?.trim() || null,
            item.item_type || 'service',
            itemQty,
            itemPrice,
            item.unit || 'u',
            item.linked_part_id || null,
            snapshotPrice,
            i,
          ]
        );
      }
    }

    // 4. Assign workers if any
    if (Array.isArray(workers) && workers.length > 0) {
      for (const w of workers) {
        if (w.worker_id) {
          const workerCheck = await sql(
            `SELECT id FROM workers WHERE id = $1 AND organization_id = $2 LIMIT 1`,
            [w.worker_id, organizationId]
          );
          if (workerCheck.length > 0) {
            const awId = crypto.randomUUID();
            await sql(
              `
              INSERT INTO action_workers (id, action_id, worker_id, hours_spent, role_on_job)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT DO NOTHING
            `,
              [awId, actionId, w.worker_id, parseFloat(w.hours_spent) || 0.0, w.role_on_job || 'lead']
            );
          }
        }
      }
    }

    // 5. Update vehicle mileage if higher
    if (mileage > (vehicleCheck[0].current_mileage || 0)) {
      await sql(
        `UPDATE vehicles SET current_mileage = $1 WHERE id = $2 AND organization_id = $3`,
        [mileage, vehicle_id, organizationId]
      );
    }

    // 6. Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'actions',
      entityId: actionId,
      action: 'create',
      metadata: { type, vehicle_id, status, items_count: items.length, has_tax: isTaxEnabled },
    });

    const createdRows = await sql(`SELECT * FROM actions WHERE id = $1 AND organization_id = $2`, [actionId, organizationId]);
    return apiSuccess(createdRows[0] || { id: actionId }, 201);
  } catch (error) {
    console.error('Failed to create action:', error);
    return apiServerError('Impossible de créer l’ordre de réparation.');
  }
}
