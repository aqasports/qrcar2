import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from '@/lib/api/response';
import crypto from 'crypto';

// PATCH /api/actions/[id]/items/[itemId] - Update a line item in place
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: actionId, itemId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, organizationId } = session.user;
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

    const itemRows = await sql(
      `SELECT * FROM repair_order_items WHERE id = $1 AND action_id = $2 LIMIT 1`,
      [itemId, actionId]
    );
    if (itemRows.length === 0) {
      return apiNotFound('Ligne d’intervention introuvable.');
    }
    const oldItem = itemRows[0];

    const body = await req.json();
    const { name, description, quantity, unit_price, unit, item_type } = body;

    const newQty = quantity !== undefined ? parseFloat(String(quantity)) || 1 : parseFloat(oldItem.quantity);
    const newPrice = unit_price !== undefined ? parseFloat(String(unit_price)) || 0 : parseFloat(oldItem.unit_price);
    const newName = name !== undefined ? name.trim() : oldItem.name;
    const newDesc = description !== undefined ? description.trim() : oldItem.description;
    const newUnit = unit !== undefined ? unit : oldItem.unit;
    const newType = item_type !== undefined ? item_type : oldItem.item_type;

    // If quantity changed on a linked part, adjust stock accordingly
    if (oldItem.linked_part_id && newQty !== parseFloat(oldItem.quantity)) {
      const diff = Math.round(newQty) - Math.round(parseFloat(oldItem.quantity));
      if (diff !== 0) {
        await sql(
          `UPDATE parts SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 AND organization_id = $3`,
          [diff, oldItem.linked_part_id, organizationId]
        );
      }
    }

    await sql(
      `
      UPDATE repair_order_items
      SET name = $1, description = $2, quantity = $3, unit_price = $4, unit = $5, item_type = $6
      WHERE id = $7 AND action_id = $8
    `,
      [newName, newDesc, newQty, newPrice, newUnit, newType, itemId, actionId]
    );

    return apiSuccess({
      id: itemId,
      action_id: actionId,
      name: newName,
      quantity: newQty,
      unit_price: newPrice,
      message: 'Ligne mise à jour avec succès.',
    });
  } catch (error) {
    console.error('Failed to update line item:', error);
    return apiServerError();
  }
}

// DELETE /api/actions/[id]/items/[itemId] - Remove a line item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: actionId, itemId } = await params;
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

    const itemRows = await sql(
      `SELECT * FROM repair_order_items WHERE id = $1 AND action_id = $2 LIMIT 1`,
      [itemId, actionId]
    );
    if (itemRows.length === 0) {
      return apiNotFound('Ligne introuvable.');
    }
    const item = itemRows[0];

    // If part was linked, restore stock
    if (item.linked_part_id) {
      const qty = Math.round(parseFloat(item.quantity || '0'));
      if (qty > 0) {
        await sql(
          `UPDATE parts SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2 AND organization_id = $3`,
          [qty, item.linked_part_id, organizationId]
        );
        const movId = crypto.randomUUID();
        await sql(
          `
          INSERT INTO stock_movements (id, organization_id, part_id, reference_action_id, action_id, type, quantity, reason, created_by)
          VALUES ($1, $2, $3, $4, $5, 'in', $6, $7, $8)
        `,
          [movId, organizationId, item.linked_part_id, actionId, actionId, qty, `Suppression ligne OR #${actionId.slice(0, 8)}`, userId]
        );

        // Also remove from legacy action_parts if present
        await sql(`DELETE FROM action_parts WHERE action_id = $1 AND part_id = $2`, [actionId, item.linked_part_id]);
      }
    }

    await sql(`DELETE FROM repair_order_items WHERE id = $1 AND action_id = $2`, [itemId, actionId]);

    return apiSuccess({ message: 'Ligne supprimée avec succès et stock réajusté.' });
  } catch (error) {
    console.error('Failed to delete line item:', error);
    return apiServerError();
  }
}
