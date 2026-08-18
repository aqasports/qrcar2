import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/messages/unread-count - Total unread direct messages count for organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ unread_count: 0 });
  }

  const { organizationId } = session.user;

  try {
    const rows = await sql(
      `
      SELECT COUNT(*) as count
      FROM direct_messages dm
      JOIN conversations c ON dm.conversation_id = c.id
      WHERE (c.org_a_id = $1 OR c.org_b_id = $1)
        AND dm.sender_org_id != $1
        AND dm.is_read = false
    `,
      [organizationId]
    );

    const count = parseInt(rows[0]?.count || '0', 10);
    return NextResponse.json({ unread_count: count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
    return NextResponse.json({ unread_count: 0 });
  }
}
