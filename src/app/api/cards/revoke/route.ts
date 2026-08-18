import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/cards/revoke - Revoke a card scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing card token' }, { status: 400 });
    }

    // 1. Verify card exists and is active in this org
    const cardRows = await sql(
      `SELECT * FROM pvc_cards WHERE token = $1 AND organization_id = $2 LIMIT 1`,
      [token, organizationId]
    );
    if (cardRows.length === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    const card = cardRows[0];
    if (card.status !== 'active') {
      return NextResponse.json({ error: 'Only active cards can be revoked' }, { status: 400 });
    }

    // 2. Revoke the card
    await sql(
      `
      UPDATE pvc_cards
      SET status = 'revoked',
          revoked_at = CURRENT_TIMESTAMP
      WHERE token = $1 AND organization_id = $2
    `,
      [token, organizationId]
    );

    // 3. Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'pvc_cards',
      entityId: card.id,
      action: 'revoke',
      metadata: {
        vehicle_id: card.vehicle_id,
        serial_label: card.serial_label,
        old_status: 'active',
        new_status: 'revoked',
      },
    });

    return NextResponse.json({
      message: 'Card successfully revoked',
      serial_label: card.serial_label,
    });
  } catch (error) {
    console.error('Failed to revoke card:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
