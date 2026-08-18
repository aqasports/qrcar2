import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/knowledgebase/solutions/[id] - Get solution details & increment views
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: solutionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    // Increment view count
    await sql(`UPDATE mechanical_solutions SET views_count = views_count + 1 WHERE id = $1`, [
      solutionId,
    ]);

    const rows = await sql(
      `
      SELECT 
        ms.*,
        o.name as author_garage_name,
        o.slug as author_slug,
        o.logo_url as author_logo,
        b.phone as author_phone,
        b.city as author_city,
        b.address as author_address,
        p.name as author_plan_name,
        p.directory_tier as author_directory_tier,
        u.name as author_user_name,
        EXISTS(
          SELECT 1 FROM solution_votes sv 
          WHERE sv.solution_id = ms.id AND sv.organization_id = $1
        ) as has_user_voted
      FROM mechanical_solutions ms
      JOIN organizations o ON ms.organization_id = o.id
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      LEFT JOIN plans p ON o.plan_id = p.id
      JOIN users u ON ms.author_user_id = u.id
      WHERE ms.id = $2
      LIMIT 1
    `,
      [organizationId, solutionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Solution introuvable.' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Failed to get solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/knowledgebase/solutions/[id] - Single-tenant update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: solutionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId, isPlatformAdmin } = session.user;

  try {
    const existing = isPlatformAdmin
      ? await sql(`SELECT * FROM mechanical_solutions WHERE id = $1 LIMIT 1`, [solutionId])
      : await sql(`SELECT * FROM mechanical_solutions WHERE id = $1 AND organization_id = $2 LIMIT 1`, [
          solutionId,
          organizationId,
        ]);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Solution introuvable ou permissions insuffisantes.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      title,
      dtc_codes,
      make,
      model,
      engine_code,
      years,
      symptoms,
      diagnostic_tool,
      root_cause,
      step_by_step_fix,
      parts_replaced,
    } = body;

    const normalizedDtc = dtc_codes !== undefined ? JSON.stringify(dtc_codes) : null;

    const updatedRows = await sql(
      `
      UPDATE mechanical_solutions
      SET title = COALESCE($1, title),
          dtc_codes = COALESCE($2, dtc_codes),
          make = COALESCE($3, make),
          model = COALESCE($4, model),
          engine_code = COALESCE($5, engine_code),
          years = COALESCE($6, years),
          symptoms = COALESCE($7, symptoms),
          diagnostic_tool = COALESCE($8, diagnostic_tool),
          root_cause = COALESCE($9, root_cause),
          step_by_step_fix = COALESCE($10, step_by_step_fix),
          parts_replaced = COALESCE($11, parts_replaced),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `,
      [
        title?.trim() || null,
        normalizedDtc,
        make?.trim() || null,
        model?.trim() || null,
        engine_code !== undefined ? engine_code : null,
        years !== undefined ? years : null,
        symptoms?.trim() || null,
        diagnostic_tool !== undefined ? diagnostic_tool : null,
        root_cause?.trim() || null,
        step_by_step_fix?.trim() || null,
        parts_replaced !== undefined ? parts_replaced : null,
        solutionId,
      ]
    );

    const updated = updatedRows[0];

    await logAudit({
      organizationId: updated.organization_id,
      userId,
      entityType: 'mechanical_solutions',
      entityId: solutionId,
      action: 'update',
      metadata: { title: updated.title },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/knowledgebase/solutions/[id] - Single-tenant delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: solutionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId, isPlatformAdmin } = session.user;

  try {
    const existing = isPlatformAdmin
      ? await sql(`SELECT * FROM mechanical_solutions WHERE id = $1 LIMIT 1`, [solutionId])
      : await sql(`SELECT * FROM mechanical_solutions WHERE id = $1 AND organization_id = $2 LIMIT 1`, [
          solutionId,
          organizationId,
        ]);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Solution introuvable.' }, { status: 404 });
    }

    await sql(`DELETE FROM mechanical_solutions WHERE id = $1`, [solutionId]);

    await logAudit({
      organizationId: existing[0].organization_id,
      userId,
      entityType: 'mechanical_solutions',
      entityId: solutionId,
      action: 'delete',
    });

    return NextResponse.json({ success: true, message: 'Solution supprimée avec succès.' });
  } catch (error: any) {
    console.error('Failed to delete solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
