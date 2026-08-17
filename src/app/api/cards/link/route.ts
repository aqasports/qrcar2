import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/cards/link - Link a card to a vehicle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { token, vehicle_id } = body;

    if (!token || !vehicle_id) {
      return NextResponse.json({ error: 'Missing token or vehicle_id' }, { status: 400 });
    }

    // 1. Verify card exists and is unassigned
    const cardRows = await sql(`SELECT * FROM pvc_cards WHERE token = $1 LIMIT 1`, [token]);
    if (cardRows.length === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    const card = cardRows[0];
    if (card.status !== 'unassigned') {
      return NextResponse.json({ error: 'Card is already linked or revoked' }, { status: 400 });
    }

    // 2. Verify vehicle exists
    const vehicleCheck = await sql(`SELECT id FROM vehicles WHERE id = $1 LIMIT 1`, [vehicle_id]);
    if (vehicleCheck.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // 3. Verify vehicle doesn't have an active card
    const activeCheck = await sql(`
      SELECT id FROM pvc_cards 
      WHERE vehicle_id = $1 AND status = 'active' 
      LIMIT 1
    `, [vehicle_id]);

    if (activeCheck.length > 0) {
      return NextResponse.json({ error: 'Vehicle already has an active QR card linked' }, { status: 400 });
    }

    // 4. Link the card
    await sql(`
      UPDATE pvc_cards
      SET status = 'active',
          vehicle_id = $1,
          linked_at = CURRENT_TIMESTAMP
      WHERE token = $2
    `, [vehicle_id, token]);

    // 5. Log audit
    await logAudit({
      userId,
      entityType: 'pvc_cards',
      entityId: card.id,
      action: 'link',
      metadata: {
        vehicle_id,
        serial_label: card.serial_label,
        old_status: 'unassigned',
        new_status: 'active'
      }
    });

    return NextResponse.json({ message: 'Card successfully linked to vehicle', serial_label: card.serial_label });
  } catch (error) {
    console.error('Failed to link card:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
