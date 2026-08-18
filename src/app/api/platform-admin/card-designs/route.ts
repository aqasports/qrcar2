import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/platform-admin/card-designs - List all card designs across all tenants
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, isPlatformAdmin } = session.user;
  if (!isPlatformAdmin && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden. Platform Admin access required.' }, { status: 403 });
  }

  try {
    const designs = await sql(`
      SELECT 
        cd.*,
        o.name as org_name,
        o.slug as org_slug,
        p.name as plan_name,
        p.card_studio_tier
      FROM card_designs cd
      JOIN organizations o ON cd.organization_id = o.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ORDER BY 
        CASE WHEN cd.status = 'submitted' THEN 1 WHEN cd.status = 'draft' THEN 2 ELSE 3 END,
        cd.updated_at DESC
    `);

    return NextResponse.json(designs);
  } catch (error: any) {
    console.error('Failed to get platform admin card designs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
