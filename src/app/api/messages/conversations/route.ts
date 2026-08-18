import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/messages/conversations - List all conversations for active garage
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const conversations = await sql(
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
          WHEN c.org_a_id = $1 THEN org_b.wilaya
          ELSE org_a.wilaya
        END as counterpart_wilaya,
        (
          SELECT COUNT(*) 
          FROM direct_messages dm 
          WHERE dm.conversation_id = c.id 
            AND dm.sender_org_id != $1 
            AND dm.is_read = false
        ) as unread_count
      FROM conversations c
      JOIN organizations org_a ON c.org_a_id = org_a.id
      JOIN organizations org_b ON c.org_b_id = org_b.id
      WHERE c.org_a_id = $1 OR c.org_b_id = $1
      ORDER BY c.last_message_at DESC
    `,
      [organizationId]
    );

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/messages/conversations - Start or retrieve conversation with another garage
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId } = session.user;

  try {
    const body = await req.json();
    const {
      recipient_org_id,
      context_type = 'general',
      context_id,
      context_title,
      message_text,
      dtc_attachment,
      part_ref_attachment,
    } = body;

    if (!recipient_org_id) {
      return NextResponse.json({ error: 'L\'atelier destinataire est obligatoire.' }, { status: 400 });
    }

    if (recipient_org_id === organizationId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas ouvrir une conversation avec votre propre atelier.' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existing = await sql(
      `
      SELECT * FROM conversations 
      WHERE (org_a_id = $1 AND org_b_id = $2) OR (org_a_id = $2 AND org_b_id = $1)
      LIMIT 1
    `,
      [organizationId, recipient_org_id]
    );

    let conversation;

    if (existing.length > 0) {
      conversation = existing[0];
      if (context_type !== 'general' && context_id) {
        // update context if applicable
        await sql(
          `
          UPDATE conversations 
          SET context_type = $1, context_id = $2, context_title = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `,
          [context_type, context_id, context_title || null, conversation.id]
        );
      }
    } else {
      // Create new conversation
      const rows = await sql(
        `
        INSERT INTO conversations (
          org_a_id, org_b_id, context_type, context_id, context_title, last_message_text
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          organizationId,
          recipient_org_id,
          context_type,
          context_id || null,
          context_title || null,
          message_text || 'Conversation initiée',
        ]
      );
      conversation = rows[0];
    }

    // If initial message text provided, post it
    if (message_text && message_text.trim()) {
      await sql(
        `
        INSERT INTO direct_messages (
          conversation_id, sender_org_id, sender_user_id, message_text,
          dtc_attachment, part_ref_attachment
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          conversation.id,
          organizationId,
          userId,
          message_text.trim(),
          dtc_attachment || null,
          part_ref_attachment || null,
        ]
      );

      await sql(
        `
        UPDATE conversations 
        SET last_message_text = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [message_text.trim(), conversation.id]
      );
    }

    await logAudit({
      organizationId,
      userId,
      entityType: 'conversations',
      entityId: conversation.id,
      action: 'create',
      metadata: { recipient_org_id, context_type },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create/get conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
