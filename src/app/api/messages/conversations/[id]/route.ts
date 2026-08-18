import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/messages/conversations/[id] - Get messages history & mark read
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, isPlatformAdmin } = session.user;

  try {
    const convRows = await sql(
      `
      SELECT 
        c.*,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.id
          ELSE org_a.id
        END as counterpart_org_id,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.name
          ELSE org_a.name
        END as counterpart_name,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.slug
          ELSE org_a.slug
        END as counterpart_slug,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.logo_url
          ELSE org_a.logo_url
        END as counterpart_logo,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.phone
          ELSE org_a.phone
        END as counterpart_phone,
        CASE 
          WHEN c.org_a_id = $1 THEN org_b.wilaya
          ELSE org_a.wilaya
        END as counterpart_wilaya
      FROM conversations c
      JOIN organizations org_a ON c.org_a_id = org_a.id
      JOIN organizations org_b ON c.org_b_id = org_b.id
      WHERE c.id = $2 AND (c.org_a_id = $1 OR c.org_b_id = $1 OR $3 = true)
      LIMIT 1
    `,
      [organizationId, conversationId, isPlatformAdmin]
    );

    if (convRows.length === 0) {
      return NextResponse.json({ error: 'Conversation introuvable ou accès refusé.' }, { status: 404 });
    }

    const conversation = convRows[0];

    // Fetch messages
    const messages = await sql(
      `
      SELECT 
        dm.*,
        u.name as sender_user_name,
        o.name as sender_org_name
      FROM direct_messages dm
      JOIN users u ON dm.sender_user_id = u.id
      JOIN organizations o ON dm.sender_org_id = o.id
      WHERE dm.conversation_id = $1
      ORDER BY dm.created_at ASC
    `,
      [conversationId]
    );

    // Mark unread messages as read
    await sql(
      `
      UPDATE direct_messages 
      SET is_read = true 
      WHERE conversation_id = $1 AND sender_org_id != $2 AND is_read = false
    `,
      [conversationId, organizationId]
    );

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Failed to get conversation messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
