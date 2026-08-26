import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { seedOrganizationTemplates } from '@/lib/seed-templates';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from '@/lib/api/response';
import crypto from 'crypto';

// GET /api/repair-templates - List templates for the organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, id: userId } = session.user;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  try {
    // 1. Auto-seed if organization has zero templates
    const countCheck = await sql(
      `SELECT COUNT(*) as count FROM repair_order_templates WHERE organization_id = $1`,
      [organizationId]
    );
    const count = parseInt(countCheck[0]?.count || '0', 10);
    if (count === 0) {
      await seedOrganizationTemplates(organizationId, userId);
    }

    // 2. Query templates with line items count and summary
    let query = `
      SELECT 
        rot.*,
        COUNT(tli.id) as items_count,
        COALESCE(SUM(tli.default_unit_price * tli.default_quantity), 0) as total_items_cost
      FROM repair_order_templates rot
      LEFT JOIN template_line_items tli ON tli.template_id = rot.id
      WHERE rot.organization_id = $1 AND rot.is_active = true
    `;
    const params: any[] = [organizationId];

    if (category && category !== 'all') {
      query += ` AND rot.category = $2`;
      params.push(category);
    }

    query += ` GROUP BY rot.id ORDER BY rot.sort_order ASC, rot.created_at ASC`;

    const templates = await sql(query, params);

    // Parse JSON fields if strings
    const formatted = templates.map((t: any) => ({
      ...t,
      checkpoints: typeof t.checkpoints === 'string' ? JSON.parse(t.checkpoints) : (t.checkpoints || []),
      suggested_parts: typeof t.suggested_parts === 'string' ? JSON.parse(t.suggested_parts) : (t.suggested_parts || []),
      default_labor_cost: parseFloat(t.default_labor_cost || '0'),
      default_labor_hours: parseFloat(t.default_labor_hours || '1'),
      items_count: parseInt(t.items_count || '0', 10),
      total_items_cost: parseFloat(t.total_items_cost || '0'),
    }));

    return apiSuccess(formatted);
  } catch (error) {
    console.error('Failed to get repair order templates:', error);
    return apiServerError();
  }
}

// POST /api/repair-templates - Create a new custom template with line items
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, id: userId, role } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée : seuls les gestionnaires peuvent créer des modèles.', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const {
      name,
      category = 'maintenance',
      description = '',
      default_labor_cost = 0,
      default_labor_hours = 1.0,
      checkpoints = [],
      suggested_parts = [],
      line_items = [],
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return apiError('Le nom du modèle est requis.', 'VALIDATION_ERROR', 400);
    }

    const templateId = crypto.randomUUID();

    // 1. Insert Template
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
        templateId,
        organizationId,
        name.trim(),
        category,
        description.trim(),
        parseFloat(default_labor_cost) || 0,
        parseFloat(default_labor_hours) || 1.0,
        1,
        0,
        JSON.stringify(checkpoints || []),
        JSON.stringify(suggested_parts || []),
        userId,
      ]
    );

    // 2. Insert line items
    if (Array.isArray(line_items) && line_items.length > 0) {
      for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        const itemId = crypto.randomUUID();
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

    return apiSuccess({ id: templateId, message: 'Modèle créé avec succès.' });
  } catch (error) {
    console.error('Failed to create template:', error);
    return apiServerError();
  }
}
