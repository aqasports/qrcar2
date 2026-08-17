import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';
import { logAudit } from '@/lib/audit';

// POST /api/cards/batch - Generate N unassigned cards
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
    const count = parseInt(body.count);

    if (isNaN(count) || count <= 0 || count > 100) {
      return NextResponse.json({ error: 'Nombre de cartes invalide. Choisissez entre 1 et 100.' }, { status: 400 });
    }

    // Determine starting serial number reliably across all SQL dialects
    const existingCards = await sql(`SELECT serial_label FROM pvc_cards`);
    let maxVal = 0;
    if (Array.isArray(existingCards)) {
      for (const c of existingCards) {
        if (c.serial_label && typeof c.serial_label === 'string') {
          const match = c.serial_label.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (!isNaN(num) && num > maxVal) {
              maxVal = num;
            }
          }
        }
      }
    }
    const startSerial = maxVal + 1;

    const cardsToInsert = [];
    const generatedSerials = [];

    for (let i = 0; i < count; i++) {
      const serialNum = startSerial + i;
      const serialLabel = `CARD-${serialNum.toString().padStart(6, '0')}`;
      const token = randomUUID(); // 128-bit crypto UUID

      cardsToInsert.push({ token, serialLabel });
      generatedSerials.push(serialLabel);
    }

    // Insert cards into database
    for (const card of cardsToInsert) {
      await sql(`
        INSERT INTO pvc_cards (token, serial_label, status)
        VALUES ($1, $2, 'unassigned')
      `, [card.token, card.serialLabel]);
    }

    // Log audit for batch generation
    await logAudit({
      userId,
      entityType: 'pvc_cards',
      entityId: userId,
      action: 'create',
      metadata: { count, batch: generatedSerials }
    });

    return NextResponse.json({
      message: `${count} cartes PVC générées avec succès.`,
      serials: generatedSerials
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate batch of cards:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
