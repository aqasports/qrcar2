import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// POST /api/messages/conversations/[id]/messages - Send a message in conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId, isPlatformAdmin } = session.user;

  try {
    const convRows = await sql(
      `
      SELECT * FROM conversations 
      WHERE id = $1 AND (org_a_id = $2 OR org_b_id = $2 OR $3 = true)
      LIMIT 1
    `,
      [conversationId, organizationId, isPlatformAdmin]
    );

    if (convRows.length === 0) {
      return NextResponse.json({ error: 'Conversation introuvable ou accès refusé.' }, { status: 404 });
    }

    const body = await req.json();
    const { message_text, dtc_attachment, part_ref_attachment } = body;

    if (!message_text || !message_text.trim()) {
      return NextResponse.json({ error: 'Le message ne peut pas être vide.' }, { status: 400 });
    }

    const msgRows = await sql(
      `
      INSERT INTO direct_messages (
        conversation_id, sender_org_id, sender_user_id, message_text,
        dtc_attachment, part_ref_attachment, is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING *
    `,
      [
        conversationId,
        organizationId,
        userId,
        message_text.trim(),
        dtc_attachment?.trim() || null,
        part_ref_attachment?.trim() || null,
      ]
    );

    await sql(
      `
      UPDATE conversations
      SET last_message_text = $1,
          last_message_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [message_text.trim(), conversationId]
    );

    return NextResponse.json(msgRows[0], { status: 201 });
  } catch (error: any) {
    console.error('Failed to post direct message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
