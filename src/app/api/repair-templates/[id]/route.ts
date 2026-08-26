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

// GET /api/repair-templates/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId } = session.user;
  const { id: templateId } = await params;

  try {
    const templates = await sql(
      `SELECT * FROM repair_order_templates WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [templateId, organizationId]
    );

    if (!templates || templates.length === 0) {
      return apiNotFound('Modèle introuvable.');
    }

    const tmpl = templates[0];
    const lineItems = await sql(
      `
      SELECT 
        tli.*,
        p.name as linked_part_name,
        p.sku as linked_part_sku,
        p.quantity_in_stock as linked_part_stock
      FROM template_line_items tli
      LEFT JOIN parts p ON p.id = tli.linked_part_id
      WHERE tli.template_id = $1
      ORDER BY tli.sort_order ASC, tli.created_at ASC
    `,
      [templateId]
    );

    const formatted = {
      ...tmpl,
      checkpoints: typeof tmpl.checkpoints === 'string' ? JSON.parse(tmpl.checkpoints) : (tmpl.checkpoints || []),
      suggested_parts: typeof tmpl.suggested_parts === 'string' ? JSON.parse(tmpl.suggested_parts) : (tmpl.suggested_parts || []),
      default_labor_cost: parseFloat(tmpl.default_labor_cost || '0'),
      default_labor_hours: parseFloat(tmpl.default_labor_hours || '1'),
      line_items: lineItems.map((item: any) => ({
        ...item,
        default_unit_price: parseFloat(item.default_unit_price || '0'),
        default_quantity: parseFloat(item.default_quantity || '1'),
        is_required: Boolean(item.is_required),
      })),
    };

    return apiSuccess(formatted);
  } catch (error) {
    console.error('Failed to get template by ID:', error);
    return apiServerError();
  }
}

// PATCH /api/repair-templates/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, role } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  const { id: templateId } = await params;

  try {
    const body = await req.json();
    const {
      name,
      category,
      description,
      default_labor_cost,
      default_labor_hours,
      is_active,
      checkpoints,
      suggested_parts,
      line_items,
    } = body;

    // Check ownership
    const existing = await sql(
      `SELECT id FROM repair_order_templates WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [templateId, organizationId]
    );
    if (!existing || existing.length === 0) {
      return apiNotFound('Modèle introuvable.');
    }

    // 1. Update Template metadata
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description.trim());
    }
    if (default_labor_cost !== undefined) {
      updates.push(`default_labor_cost = $${idx++}`);
      values.push(parseFloat(default_labor_cost) || 0);
    }
    if (default_labor_hours !== undefined) {
      updates.push(`default_labor_hours = $${idx++}`);
      values.push(parseFloat(default_labor_hours) || 1.0);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(is_active ? 1 : 0);
    }
    if (checkpoints !== undefined) {
      updates.push(`checkpoints = $${idx++}`);
      values.push(JSON.stringify(checkpoints));
    }
    if (suggested_parts !== undefined) {
      updates.push(`suggested_parts = $${idx++}`);
      values.push(JSON.stringify(suggested_parts));
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(templateId, organizationId);
    await sql(
      `UPDATE repair_order_templates SET ${updates.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++}`,
      values
    );

    // 2. If line items provided, replace them atomically
    if (Array.isArray(line_items)) {
      await sql(`DELETE FROM template_line_items WHERE template_id = $1`, [templateId]);

      for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        const itemId = item.id || crypto.randomUUID();
        await sql(
          `
          INSERT INTO template_line_items (
            id, template_id, name, description, item_type,
            default_unit_price, default_quantity, unit,
            linked_part_id, is_required, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
          [
            itemId,
            templateId,
            item.name?.trim() || 'Prestation',
            item.description?.trim() || null,
            item.item_type || 'service',
            parseFloat(item.default_unit_price) || 0,
            parseFloat(item.default_quantity) || 1,
            item.unit || 'u',
            item.linked_part_id || null,
            item.is_required ? 1 : 0,
            i,
          ]
        );
      }
    }

    return apiSuccess({ message: 'Modèle mis à jour avec succès.' });
  } catch (error) {
    console.error('Failed to update template:', error);
    return apiServerError();
  }
}

// DELETE /api/repair-templates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, role } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  const { id: templateId } = await params;

  try {
    await sql(
      `DELETE FROM repair_order_templates WHERE id = $1 AND organization_id = $2`,
      [templateId, organizationId]
    );

    return apiSuccess({ message: 'Modèle supprimé avec succès.' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return apiServerError();
  }
}
