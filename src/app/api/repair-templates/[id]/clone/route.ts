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

// POST /api/repair-templates/[id]/clone - Deep clone a template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, id: userId, role } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  const { id: templateId } = await params;

  try {
    const existing = await sql(
      `SELECT * FROM repair_order_templates WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [templateId, organizationId]
    );

    if (!existing || existing.length === 0) {
      return apiNotFound('Modèle source introuvable.');
    }

    const src = existing[0];
    const newTemplateId = crypto.randomUUID();
    const newName = `${src.name} (Copie)`;

    // 1. Insert cloned template
    await sql(
      `
      INSERT INTO repair_order_templates (
        id, organization_id, name, category, description,
        default_labor_cost, default_labor_hours, is_active,
        sort_order, checkpoints, suggested_parts, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        newTemplateId,
        organizationId,
        newName,
        src.category,
        src.description,
        src.default_labor_cost,
        src.default_labor_hours,
        1,
        (src.sort_order || 0) + 1,
        typeof src.checkpoints === 'string' ? src.checkpoints : JSON.stringify(src.checkpoints || []),
        typeof src.suggested_parts === 'string' ? src.suggested_parts : JSON.stringify(src.suggested_parts || []),
        userId,
      ]
    );

    // 2. Clone line items
    const srcItems = await sql(
      `SELECT * FROM template_line_items WHERE template_id = $1 ORDER BY sort_order ASC`,
      [templateId]
    );

    for (let i = 0; i < srcItems.length; i++) {
      const item = srcItems[i];
      const newItemId = crypto.randomUUID();
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
          newItemId,
          newTemplateId,
          item.name,
          item.description,
          item.item_type,
          item.default_unit_price,
          item.default_quantity,
          item.unit,
          item.linked_part_id,
          item.is_required,
          item.sort_order,
        ]
      );
    }

    return apiSuccess({
      id: newTemplateId,
      name: newName,
      message: 'Modèle dupliqué avec succès.',
    });
  } catch (error) {
    console.error('Failed to clone template:', error);
    return apiServerError();
  }
}
