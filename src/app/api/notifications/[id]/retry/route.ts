import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { dispatchNotification } from '@/lib/notifications';

// POST /api/notifications/[id]/retry - Retry a failed notification
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notificationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, isPlatformAdmin } = session.user;

  try {
    const rows = await sql(
      `SELECT * FROM notification_queue WHERE id = $1 AND (organization_id = $2 OR $3 = true) LIMIT 1`,
      [notificationId, organizationId, isPlatformAdmin]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Notification introuvable.' }, { status: 404 });
    }

    const updated = await dispatchNotification(notificationId);
    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    console.error('Failed to retry notification:', error);
    return NextResponse.json(
      { error: error.message || 'Échec lors de la réexpédition.' },
      { status: 500 }
    );
  }
}
