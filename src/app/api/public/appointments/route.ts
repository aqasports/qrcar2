import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { headers } from 'next/headers';
import { getStore } from '@netlify/blobs';

// Global serverless rate limiting helper
async function checkPublicRateLimit(ip: string, action: string, maxRequests = 10): Promise<boolean> {
  try {
    const store = getStore({ name: 'rate-limit' });
    const key = `${action}:${ip}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes window

    const record = await store.get(key, { type: 'json' }) as { count: number; expiresAt: number } | null;

    if (!record || now > record.expiresAt) {
      await store.setJSON(key, { count: 1, expiresAt: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    await store.setJSON(key, { count: record.count + 1, expiresAt: record.expiresAt });
    return true;
  } catch (e) {
    console.error('Rate limiter error:', e);
    return true; // fail-open
  }
}

// POST /api/public/appointments - Client books an appointment via public QR token
export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-nf-client-connection-ip') || headersList.get('x-forwarded-for') || '127.0.0.1';
    
    // Rate limit public bookings: max 5 bookings per 5 minutes per IP
    const allowed = await checkPublicRateLimit(ip, 'booking', 5);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
    }

    const body = await req.json();
    const { token, service_type, preferred_date, preferred_time_slot, current_mileage, notes, client_phone } = body;

    if (!token || !service_type || !preferred_date) {
      return NextResponse.json({ error: 'Token, service type, and preferred date are required.' }, { status: 400 });
    }

    // 1. Verify Card & Token
    const cardRows = await sql(`SELECT * FROM pvc_cards WHERE token = $1 LIMIT 1`, [token]);
    if (cardRows.length === 0 || cardRows[0].status !== 'active' || !cardRows[0].vehicle_id) {
      return NextResponse.json({ error: 'Invalid or inactive card token.' }, { status: 403 });
    }

    const vehicleId = cardRows[0].vehicle_id;

    // 2. Optional: update vehicle current mileage if newer
    if (current_mileage && Number(current_mileage) > 0) {
      const parsedMileage = parseInt(current_mileage, 10);
      await sql(`
        UPDATE vehicles
        SET current_mileage = GREATEST(current_mileage, $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [parsedMileage, vehicleId]);
    }

    // 3. Insert Appointment
    const appointmentRows = await sql(`
      INSERT INTO appointments (
        vehicle_id, service_type, preferred_date, preferred_time_slot,
        current_mileage, notes, client_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [
      vehicleId,
      service_type,
      preferred_date,
      preferred_time_slot || 'morning',
      current_mileage ? parseInt(current_mileage, 10) : null,
      notes || null,
      client_phone || null,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous enregistré avec succès. Le garage confirmera votre créneau.',
      appointment: appointmentRows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de la réservation.' }, { status: 500 });
  }
}
