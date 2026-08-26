import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from '@/lib/api/response';
import crypto from 'crypto';

// POST /api/actions/[id]/items - Add a line item to an action
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: actionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  try {
    const actionRows = await sql(
      `SELECT id, status FROM actions WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [actionId, organizationId]
    );
    if (actionRows.length === 0) {
      return apiNotFound('Ordre de réparation introuvable.');
    }
    if (actionRows[0].status === 'invoiced') {
      return apiError('Impossible de modifier un ordre de réparation déjà facturé.', 'ACTION_INVOICED', 400);
    }

    const body = await req.json();
    const {
      name,
      description,
      item_type = 'service',
      quantity = 1,
      unit_price = 0,
      unit = 'u',
      linked_part_id,
    } = body;

    if (!name || !name.trim()) {
      return apiError('La désignation de la prestation ou de la pièce est obligatoire.', 'VALIDATION_ERROR', 400);
    }

    const qty = parseFloat(String(quantity)) || 1;
    const price = parseFloat(String(unit_price)) || 0;
    const itemId = crypto.randomUUID();

    let snapshotPrice: number | null = null;

    if (linked_part_id) {
      const partRows = await sql(
        `SELECT id, sale_price, quantity_in_stock FROM parts WHERE id = $1 AND organization_id = $2 LIMIT 1`,
        [linked_part_id, organizationId]
      );
      if (partRows.length > 0) {
        const part = partRows[0];
        snapshotPrice = parseFloat(part.sale_price || '0');

        // Decrement stock
        await sql(
          `UPDATE parts SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 AND organization_id = $3`,
          [Math.round(qty), part.id, organizationId]
        );

        // Movement
        const movId = crypto.randomUUID();
        await sql(
          `
          INSERT INTO stock_movements (id, organization_id, part_id, reference_action_id, action_id, type, quantity, reason, created_by)
          VALUES ($1, $2, $3, $4, $5, 'out', $6, $7, $8)
        `,
          [movId, organizationId, part.id, actionId, actionId, Math.round(qty), `Ajout ligne OR #${actionId.slice(0, 8)}`, userId]
        );

        // Sync legacy action_parts
        await sql(
          `
          INSERT INTO action_parts (action_id, part_id, quantity, unit_price_snapshot)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (action_id, part_id) DO UPDATE SET
            quantity = action_parts.quantity + EXCLUDED.quantity,
            unit_price_snapshot = EXCLUDED.unit_price_snapshot
        `,
          [actionId, part.id, Math.round(qty), snapshotPrice]
        );
      }
    }

    // Insert into repair_order_items
    const orderCountRows = await sql(
      `SELECT COUNT(*) as count FROM repair_order_items WHERE action_id = $1`,
      [actionId]
    );
    const sortOrder = parseInt(orderCountRows[0]?.count || '0', 10);

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
        name.trim(),
        description ? description.trim() : null,
        item_type,
        qty,
        price,
        unit,
        linked_part_id || null,
        snapshotPrice,
        sortOrder,
      ]
    );

    return apiSuccess({
      id: itemId,
      action_id: actionId,
      name,
      quantity: qty,
      unit_price: price,
      message: 'Ligne ajoutée avec succès.',
    }, 201);
  } catch (error) {
    console.error('Failed to add item to action:', error);
    return apiServerError();
  }
}
