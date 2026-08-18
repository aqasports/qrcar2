import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processNotificationQueue } from '@/lib/notifications';

// POST /api/notifications/process - Process batch of pending notifications
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await processNotificationQueue(25);
    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    console.error('Failed to process notifications queue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
