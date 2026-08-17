import React from 'react';
import { sql } from '@/lib/db';
import { headers } from 'next/headers';
import { getStore } from '@netlify/blobs';
import QRCode from 'qrcode';
import { ClientPortalView, VehicleData, PublicAction, AppointmentData, ReminderData } from './client-portal-view';

// Global serverless rate limiting helper using Netlify Blobs
async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const store = getStore({ name: 'rate-limit' });
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute sliding window
    const maxRequests = 60; // Max 60 requests/minute per IP

    const record = await store.get(ip, { type: 'json' }) as { count: number; expiresAt: number } | null;

    if (!record || now > record.expiresAt) {
      await store.setJSON(ip, { count: 1, expiresAt: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false; // Limit exceeded
    }

    await store.setJSON(ip, { count: record.count + 1, expiresAt: record.expiresAt });
    return true;
  } catch (e) {
    console.error('Rate limiter store error, allowing request:', e);
    return true; // fail-open
  }
}

// Function to fetch all public vehicle data server-side
async function getPublicVehicleData(token: string) {
  // 1. Fetch card details
  const cardRows = await sql(`SELECT * FROM pvc_cards WHERE token = $1 LIMIT 1`, [token]);
  if (cardRows.length === 0) {
    return { status: 'invalid' };
  }

  const card = cardRows[0];
  if (card.status === 'revoked') {
    return { status: 'revoked' };
  }

  if (card.status !== 'active' || !card.vehicle_id) {
    return { status: 'invalid' };
  }

  // 2. Fetch vehicle details (enforce no client email/phone/address in response to protect PII)
  const vehicleRows = await sql(`
    SELECT v.id, v.plate_number, v.make, v.model, v.year, v.color, v.current_mileage,
           v.fuel_type, v.transmission, v.engine_spec, v.oil_type, v.tire_size,
           v.next_service_mileage, v.next_service_date, v.next_inspection_date,
           c.full_name as client_name
    FROM vehicles v
    JOIN clients c ON v.client_id = c.id
    WHERE v.id = $1
    LIMIT 1
  `, [card.vehicle_id]);

  if (vehicleRows.length === 0) {
    return { status: 'invalid' };
  }

  const vehicle: VehicleData = vehicleRows[0];

  // 3. Fetch actions history (completed or invoiced, client_visible_notes only, NO internal_notes)
  const actionRows = await sql(`
    SELECT a.id, a.type, a.description, a.client_visible_notes, a.mileage_at_service, a.date_in, a.date_out,
           (SELECT i.id FROM invoices i WHERE i.action_id = a.id AND i.status IN ('issued', 'paid') LIMIT 1) as invoice_id
    FROM actions a
    WHERE a.vehicle_id = $1 AND a.status IN ('completed', 'invoiced')
    ORDER BY a.date_in DESC
  `, [vehicle.id]);

  // 4. Fetch appointments for this vehicle
  const appointmentRows = await sql(`
    SELECT id, service_type, preferred_date, preferred_time_slot, current_mileage, notes, status, garage_response, created_at
    FROM appointments
    WHERE vehicle_id = $1
    ORDER BY preferred_date DESC, created_at DESC
  `, [vehicle.id]);

  // 5. Fetch reminders for this vehicle
  const reminderRows = await sql(`
    SELECT id, type, title, due_date, due_mileage, status
    FROM reminders
    WHERE vehicle_id = $1
    ORDER BY created_at DESC
  `, [vehicle.id]);

  return {
    status: 'active',
    vehicle,
    actions: actionRows as PublicAction[],
    appointments: appointmentRows as AppointmentData[],
    reminders: reminderRows as ReminderData[],
  };
}

export default async function PublicQRPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Rate Limiting Check
  const headersList = await headers();
  const ip = headersList.get('x-nf-client-connection-ip') || headersList.get('x-forwarded-for') || '127.0.0.1';
  const allowed = await checkRateLimit(ip);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 p-8 rounded-2xl text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl mb-4 font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-100">Rate Limit Exceeded</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            You have scanned or refreshed this history token too many times in a short period. Please wait 1 minute before trying again.
          </p>
        </div>
      </div>
    );
  }

  const data = await getPublicVehicleData(token);

  if (data.status === 'revoked') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/20 p-8 rounded-2xl text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-xl mb-4 font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-100">Carte Désactivée</h2>
          <p className="text-slate-400 text-sm mt-2">
            Cette carte d&apos;identité véhicule a été désactivée ou révoquée. Veuillez vous rapprocher de l&apos;accueil de votre garage pour obtenir un remplacement.
          </p>
        </div>
      </div>
    );
  }

  if (data.status === 'invalid' || !data.vehicle) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl mb-4 font-bold">
            ?
          </div>
          <h2 className="text-xl font-bold text-slate-100">Carte Invalide</h2>
          <p className="text-slate-400 text-sm mt-2">
            Le QR code scanné n&apos;est pas encore associé à un véhicule ou le jeton est invalide.
          </p>
        </div>
      </div>
    );
  }

  // Generate QR Data URL for the card visual
  const cardUrl = `https://garagepro.app/v/${token}`;
  const qrDataUrl = await QRCode.toDataURL(cardUrl, { width: 300, margin: 1 });

  return (
    <ClientPortalView
      token={token}
      vehicle={data.vehicle}
      actions={data.actions || []}
      appointments={data.appointments || []}
      reminders={data.reminders || []}
      qrDataUrl={qrDataUrl}
    />
  );
}
