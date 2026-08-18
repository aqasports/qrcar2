import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getOrganizationPlanDetails } from '@/lib/plans';

// GET /api/knowledgebase/solutions - Cross-Tenant DTC & Mechanical Solutions Search
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(req.url);

  const dtc = searchParams.get('dtc')?.trim().toUpperCase() || '';
  const make = searchParams.get('make')?.trim() || '';
  const model = searchParams.get('model')?.trim() || '';
  const search = searchParams.get('search')?.trim() || '';
  const mineOnly = searchParams.get('mine_only') === 'true';

  try {
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (mineOnly) {
      whereConditions.push(`ms.organization_id = $${paramIdx++}`);
      queryParams.push(organizationId);
    }

    if (dtc) {
      whereConditions.push(`(ms.dtc_codes::text ILIKE $${paramIdx} OR ms.title ILIKE $${paramIdx})`);
      queryParams.push(`%${dtc}%`);
      paramIdx++;
    }

    if (make && make !== 'all') {
      whereConditions.push(`ms.make ILIKE $${paramIdx++}`);
      queryParams.push(`%${make}%`);
    }

    if (model && model !== 'all') {
      whereConditions.push(`ms.model ILIKE $${paramIdx++}`);
      queryParams.push(`%${model}%`);
    }

    if (search) {
      whereConditions.push(
        `(ms.title ILIKE $${paramIdx} OR ms.symptoms ILIKE $${paramIdx} OR ms.root_cause ILIKE $${paramIdx} OR ms.step_by_step_fix ILIKE $${paramIdx} OR ms.engine_code ILIKE $${paramIdx})`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ms.*,
        o.name as author_garage_name,
        o.slug as author_slug,
        o.logo_url as author_logo,
        b.city as author_city,
        p.name as author_plan_name,
        p.directory_tier as author_directory_tier,
        u.name as author_user_name,
        EXISTS(
          SELECT 1 FROM solution_votes sv 
          WHERE sv.solution_id = ms.id AND sv.organization_id = $${paramIdx}
        ) as has_user_voted
      FROM mechanical_solutions ms
      JOIN organizations o ON ms.organization_id = o.id
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      LEFT JOIN plans p ON o.plan_id = p.id
      JOIN users u ON ms.author_user_id = u.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN p.directory_tier = 'spotlight' THEN 1
          WHEN p.directory_tier = 'featured' THEN 2
          ELSE 3
        END,
        ms.upvotes_count DESC,
        ms.created_at DESC
    `;

    queryParams.push(organizationId);

    const solutions = await sql(query, queryParams);

    return NextResponse.json(solutions);
  } catch (error: any) {
    console.error('Failed to get mechanical solutions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/knowledgebase/solutions - Create new diagnostic solution
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId } = session.user;

  try {
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

    if (!title || !make || !model || !symptoms || !root_cause || !step_by_step_fix) {
      return NextResponse.json(
        {
          error:
            'Veuillez renseigner les champs essentiels (Titre, Marque, Modèle, Symptômes, Cause Racine, Procédure de Réparation).',
        },
        { status: 400 }
      );
    }

    // Verify Plan for verified expert badge
    const planDetails = await getOrganizationPlanDetails(organizationId);
    const isExpert =
      planDetails.plan.slug === 'pro' ||
      planDetails.plan.slug === 'enterprise' ||
      planDetails.plan.directoryTier === 'spotlight';

    const normalizedDtc = Array.isArray(dtc_codes)
      ? dtc_codes.map((c: string) => c.trim().toUpperCase()).filter(Boolean)
      : typeof dtc_codes === 'string'
      ? dtc_codes.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [];

    const rows = await sql(
      `
      INSERT INTO mechanical_solutions (
        organization_id, author_user_id, title, dtc_codes,
        make, model, engine_code, years, symptoms,
        diagnostic_tool, root_cause, step_by_step_fix, parts_replaced,
        is_verified_expert
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
      [
        organizationId,
        userId,
        title.trim(),
        JSON.stringify(normalizedDtc),
        make.trim(),
        model.trim(),
        engine_code?.trim() || null,
        years?.trim() || null,
        symptoms.trim(),
        diagnostic_tool?.trim() || null,
        root_cause.trim(),
        step_by_step_fix.trim(),
        parts_replaced?.trim() || null,
        isExpert,
      ]
    );

    const solution = rows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'mechanical_solutions',
      entityId: solution.id,
      action: 'create',
      metadata: { title: solution.title, make: solution.make, dtc: normalizedDtc },
    });

    return NextResponse.json(solution, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create mechanical solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
