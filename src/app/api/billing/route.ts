import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrganizationPlanDetails } from '@/lib/plans';
import { sql } from '@/lib/db';

// GET /api/billing - Get current organization's subscription, plan, usage, and payments
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId, isPlatformAdmin } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const details = await getOrganizationPlanDetails(organizationId);

    // Fetch all available plans
    const allPlans = await sql(
      `SELECT * FROM plans WHERE active = true ORDER BY price_monthly ASC`
    );

    return NextResponse.json({
      details,
      plans: allPlans,
    });
  } catch (error: any) {
    console.error('Failed to get billing details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
