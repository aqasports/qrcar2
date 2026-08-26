import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processNotificationQueue } from '@/lib/notifications';

// POST /api/notifications/process - Process batch of pending notifications (scoped or platform admin/cron)
export async function POST(req: NextRequest) {
  // 1. Check for internal cron authorization header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isCronAuthorized) {
    try {
      const results = await processNotificationQueue(25);
      return NextResponse.json({ processed: results.length, scope: 'global_cron', results });
    } catch (error: any) {
      console.error('Failed to process notifications queue via cron:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // 2. Otherwise require authenticated session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { isPlatformAdmin, role, organizationId } = session.user;
  const canProcessGlobal = isPlatformAdmin || role === 'platform_admin';

  try {
    // If platform admin, process globally; otherwise scope strictly to tenant
    const results = await processNotificationQueue(
      25,
      canProcessGlobal ? undefined : organizationId
    );
    return NextResponse.json({
      processed: results.length,
      scope: canProcessGlobal ? 'global_admin' : 'organization',
      results,
    });
  } catch (error: any) {
    console.error('Failed to process notifications queue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

