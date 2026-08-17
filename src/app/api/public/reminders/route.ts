import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { headers } from 'next/headers';
import { getStore } from '@netlify/blobs';

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const store = getStore({ name: 'rate-limit' });
    const key = `reminder:${ip}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const record = await store.get(key, { type: 'json' }) as { count: number; expiresAt: number } | null;

    if (!record || now > record.expiresAt) {
      await store.setJSON(key, { count: 1, expiresAt: now + windowMs });
      return true;
    }
    if (record.count >= 10) return false;
    await store.setJSON(key, { count: record.count + 1, expiresAt: record.expiresAt });
    return true;
  } catch (e) {
    return true;
  }
}

// POST /api/public/reminders - Client sets a reminder notification preference
export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-nf-client-connection-ip') || headersList.get('x-forwarded-for') || '127.0.0.1';
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter.' }, { status: 429 });
    }

    const body = await req.json();
    const { token, type, title, due_date, due_mileage, notification_channel, contact_target } = body;

    if (!token || !type || !title) {
      return NextResponse.json({ error: 'Token, type, and title are required.' }, { status: 400 });
    }

    // 1. Verify Card Token
    const cardRows = await sql(`SELECT * FROM pvc_cards WHERE token = $1 LIMIT 1`, [token]);
    if (cardRows.length === 0 || cardRows[0].status !== 'active' || !cardRows[0].vehicle_id) {
      return NextResponse.json({ error: 'Carte inactive ou invalide.' }, { status: 403 });
    }

    const vehicleId = cardRows[0].vehicle_id;

    // 2. Insert Reminder
    const reminderRows = await sql(`
      INSERT INTO reminders (
        vehicle_id, type, title, due_date, due_mileage, notification_channel, contact_target, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `, [
      vehicleId,
      type,
      title,
      due_date || null,
      due_mileage ? parseInt(due_mileage, 10) : null,
      notification_channel || 'calendar',
      contact_target || null,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Rappel configuré avec succès.',
      reminder: reminderRows[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ error: 'Erreur lors de la configuration du rappel.' }, { status: 500 });
  }
}
