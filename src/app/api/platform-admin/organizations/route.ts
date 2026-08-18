import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/platform-admin/organizations - Fetch all garages and platform metrics
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
    // 1. Fetch all organizations with joined plan, member counts, and vehicle counts
    const orgs = await sql(`
      SELECT 
        o.id,
        o.name,
        o.slug,
        o.subscription_status,
        o.trial_ends_at,
        o.current_period_ends_at,
        o.created_at,
        p.name as plan_name,
        p.slug as plan_slug,
        p.price_monthly,
        (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as members_count,
        (SELECT COUNT(*) FROM vehicles v WHERE v.organization_id = o.id) as vehicles_count,
        (SELECT COUNT(*) FROM actions a WHERE a.organization_id = o.id) as actions_count
      FROM organizations o
      LEFT JOIN plans p ON o.plan_id = p.id
      ORDER BY o.created_at DESC
    `);

    // 2. Compute Global Platform Metrics
    const totalGarages = orgs.length;
    const activeCount = orgs.filter((o: any) => o.subscription_status === 'active').length;
    const trialingCount = orgs.filter((o: any) => o.subscription_status === 'trialing').length;
    const pastDueCount = orgs.filter((o: any) => o.subscription_status === 'past_due' || o.subscription_status === 'canceled').length;

    const totalMRR = orgs
      .filter((o: any) => o.subscription_status === 'active')
      .reduce((sum: number, o: any) => sum + (parseFloat(o.price_monthly) || 0), 0);

    const totalVehicles = orgs.reduce((sum: number, o: any) => sum + (parseInt(o.vehicles_count, 10) || 0), 0);
    const totalActions = orgs.reduce((sum: number, o: any) => sum + (parseInt(o.actions_count, 10) || 0), 0);

    return NextResponse.json({
      metrics: {
        totalGarages,
        activeCount,
        trialingCount,
        pastDueCount,
        totalMRR,
        totalVehicles,
        totalActions,
      },
      organizations: orgs,
    });
  } catch (error: any) {
    console.error('Failed to get platform admin organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
