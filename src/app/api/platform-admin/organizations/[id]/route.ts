import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// PATCH /api/platform-admin/organizations/[id] - Update garage subscription status, plan or extend trial
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, isPlatformAdmin, id: userId } = session.user;
  if (!isPlatformAdmin && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden. Platform Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { subscription_status, extend_trial_days, plan_slug } = body;

    // Check organization exists
    const orgRows = await sql(`SELECT * FROM organizations WHERE id = $1 LIMIT 1`, [orgId]);
    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const oldOrg = orgRows[0];

    let newStatus = subscription_status || oldOrg.subscription_status;
    let newTrialEndsAt = oldOrg.trial_ends_at;

    if (extend_trial_days && Number(extend_trial_days) > 0) {
      const currentExpiry = oldOrg.trial_ends_at ? new Date(oldOrg.trial_ends_at).getTime() : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      newTrialEndsAt = new Date(baseTime + Number(extend_trial_days) * 24 * 60 * 60 * 1000).toISOString();
      newStatus = 'trialing';
    }

    let planId = oldOrg.plan_id;
    if (plan_slug) {
      const planRows = await sql(`SELECT id FROM plans WHERE slug = $1 LIMIT 1`, [plan_slug]);
      if (planRows.length > 0) {
        planId = planRows[0].id;
      }
    }

    const updatedRows = await sql(
      `
      UPDATE organizations
      SET subscription_status = $1,
          trial_ends_at = $2,
          plan_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `,
      [newStatus, newTrialEndsAt, planId, orgId]
    );

    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'organizations',
      entityId: orgId,
      action: 'update',
      metadata: {
        platform_admin_override: true,
        old_status: oldOrg.subscription_status,
        new_status: newStatus,
        extended_days: extend_trial_days,
      },
    });

    return NextResponse.json(updatedRows[0]);
  } catch (error: any) {
    console.error('Failed to update organization status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
