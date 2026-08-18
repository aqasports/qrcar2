import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { enqueueNotification, dispatchNotification } from '@/lib/notifications';

// GET /api/notifications - List notification history for active organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(req.url);

  const channel = searchParams.get('channel');
  const status = searchParams.get('status');

  try {
    let whereConditions = [`organization_id = $1`];
    let queryParams: any[] = [organizationId];
    let paramIdx = 2;

    if (channel && channel !== 'all') {
      whereConditions.push(`channel = $${paramIdx++}`);
      queryParams.push(channel);
    }

    if (status && status !== 'all') {
      whereConditions.push(`status = $${paramIdx++}`);
      queryParams.push(status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const notifications = await sql(
      `
      SELECT * FROM notification_queue
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `,
      queryParams
    );

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/notifications - Enqueue or send a test notification
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, orgName } = session.user;

  try {
    const body = await req.json();
    const { channel, recipient, template, subject, payload, send_immediately = true } = body;

    if (!channel || !recipient || !template) {
      return NextResponse.json(
        { error: 'Canal (SMS/Email/WhatsApp), destinataire et modèle requis.' },
        { status: 400 }
      );
    }

    const queued = await enqueueNotification({
      organizationId,
      channel,
      recipient,
      template,
      subject,
      payload: {
        ...payload,
        garage_name: orgName,
      },
    });

    if (send_immediately && queued?.id) {
      const dispatched = await dispatchNotification(queued.id);
      return NextResponse.json({ success: true, notification: dispatched }, { status: 201 });
    }

    return NextResponse.json({ success: true, notification: queued }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
