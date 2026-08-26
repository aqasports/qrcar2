import { sql } from '@/lib/db';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';

export type NotificationTemplate =
  | 'intervention_completed'
  | 'card_ready'
  | 'maintenance_reminder'
  | 'direct_message'
  | 'marketplace_inquiry'
  | 'subscription_invoice';

export interface NotificationPayload {
  garage_name?: string;
  client_name?: string;
  vehicle_name?: string;
  plate_number?: string;
  qr_url?: string;
  total_price?: number | string;
  due_date?: string;
  due_mileage?: number | string;
  sender_garage_name?: string;
  part_title?: string;
  plan_name?: string;
  custom_message?: string;
}

export interface EnqueueNotificationParams {
  organizationId: string;
  channel: NotificationChannel;
  recipient: string;
  template: NotificationTemplate;
  subject?: string;
  payload: NotificationPayload;
}

/**
 * Renders high-precision automotive copy for SMS, WhatsApp, and Email
 */
export function renderNotificationMessage(
  template: NotificationTemplate,
  payload: NotificationPayload
): { subject: string; text: string } {
  switch (template) {
    case 'intervention_completed':
      return {
        subject: `Véhicule Prêt - ${payload.vehicle_name || 'Votre Véhicule'} (${payload.plate_number})`,
        text: `Bonjour ${payload.client_name || 'Cher client'}, les travaux sur votre véhicule ${payload.vehicle_name || ''} (${payload.plate_number || ''}) sont terminés à l'atelier ${payload.garage_name || 'Garage Pro'}.${payload.total_price ? ` Montant : ${payload.total_price} DZD.` : ''} Consultez l'historique : ${payload.qr_url || 'https://garagepro.app'}`,
      };

    case 'card_ready':
      return {
        subject: `Passeport Connecté Prêt - ${payload.plate_number}`,
        text: `Bonjour ${payload.client_name || 'Cher client'}, la carte d'identité PVC connectée pour votre véhicule (${payload.plate_number || ''}) est prête à l'atelier ${payload.garage_name || 'Garage Pro'}.`,
      };

    case 'maintenance_reminder':
      return {
        subject: `Rappel d'Entretien - ${payload.plate_number}`,
        text: `Rappel Entretien ${payload.garage_name || 'Atelier'} : L'échéance de révision de votre véhicule (${payload.plate_number || ''}) approche${payload.due_mileage ? ` (${payload.due_mileage} km)` : ''}${payload.due_date ? ` le ${payload.due_date}` : ''}. Prenez rendez-vous dès maintenant.`,
      };

    case 'direct_message':
      return {
        subject: `Nouveau Message Confrère - ${payload.sender_garage_name || 'Garage Pro'}`,
        text: `L'atelier ${payload.sender_garage_name || 'un confrère'} vous a envoyé un message direct sur votre espace pro Garage Pro.${payload.custom_message ? ` "${payload.custom_message}"` : ''}`,
      };

    case 'marketplace_inquiry':
      return {
        subject: `Nouvelle Offre Pièce Détachée - ${payload.part_title || 'Marketplace'}`,
        text: `Vous avez reçu une demande pour votre pièce "${payload.part_title || ''}" de la part de l'atelier ${payload.sender_garage_name || 'confrère'}.`,
      };

    case 'subscription_invoice':
      return {
        subject: `Facture d'Abonnement Garage Pro - ${payload.plan_name}`,
        text: `Votre abonnement Garage Pro ${payload.plan_name || ''} a été renouvelé avec succès (${payload.total_price || ''} DZD). Merci de votre confiance.`,
      };

    default:
      return {
        subject: `Notification Atelier - ${payload.garage_name || 'Garage Pro'}`,
        text: payload.custom_message || 'Nouvelle notification de votre atelier automobile.',
      };
  }
}

/**
 * Enqueue a notification for asynchronous multi-channel delivery
 */
export async function enqueueNotification(params: EnqueueNotificationParams) {
  const { organizationId, channel, recipient, template, subject, payload } = params;
  const rendered = renderNotificationMessage(template, payload);

  const finalSubject = subject || rendered.subject;

  const rows = await sql(
    `
    INSERT INTO notification_queue (
      organization_id, channel, recipient, template, subject, payload, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *
  `,
    [
      organizationId,
      channel,
      recipient.trim(),
      template,
      finalSubject,
      JSON.stringify(payload),
    ]
  );

  return rows[0];
}

/**
 * Dispatches a single queued notification across the appropriate channel
 */
export async function dispatchNotification(notificationId: string) {
  const rows = await sql(`SELECT * FROM notification_queue WHERE id = $1 LIMIT 1`, [notificationId]);
  if (rows.length === 0) return null;

  const item = rows[0];
  const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
  const rendered = renderNotificationMessage(item.template as NotificationTemplate, payload);

  try {
    // Channel-specific delivery logic
    if (item.channel === 'sms') {
      console.log(`[SMS DISPATCH] To: ${item.recipient} | Body: ${rendered.text}`);
    } else if (item.channel === 'whatsapp') {
      console.log(`[WHATSAPP DISPATCH] To: ${item.recipient} | Body: ${rendered.text}`);
    } else if (item.channel === 'email') {
      console.log(`[EMAIL DISPATCH] To: ${item.recipient} | Subject: ${rendered.subject} | Body: ${rendered.text}`);
    }

    const updated = await sql(
      `
      UPDATE notification_queue
      SET status = 'sent',
          attempts = attempts + 1,
          sent_at = CURRENT_TIMESTAMP,
          last_error = NULL
      WHERE id = $1
      RETURNING *
    `,
      [notificationId]
    );

    return updated[0];
  } catch (err: any) {
    console.error(`Failed to dispatch notification ${notificationId}:`, err);
    await sql(
      `
      UPDATE notification_queue
      SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'retrying' END,
          attempts = attempts + 1,
          last_error = $1
      WHERE id = $2
    `,
      [err.message || 'Dispatch error', notificationId]
    );
    throw err;
  }
}

/**
 * Process pending notifications in queue (tenant-scoped or global)
 */
export async function processNotificationQueue(limit = 20, organizationId?: string) {
  let pending;
  if (organizationId) {
    pending = await sql(
      `
      SELECT id FROM notification_queue 
      WHERE status IN ('pending', 'retrying') AND organization_id = $2
      ORDER BY created_at ASC 
      LIMIT $1
    `,
      [limit, organizationId]
    );
  } else {
    pending = await sql(
      `
      SELECT id FROM notification_queue 
      WHERE status IN ('pending', 'retrying') 
      ORDER BY created_at ASC 
      LIMIT $1
    `,
      [limit]
    );
  }

  const results = [];
  for (const item of pending) {
    try {
      const res = await dispatchNotification(item.id);
      results.push({ id: item.id, success: true, item: res });
    } catch (err: any) {
      results.push({ id: item.id, success: false, error: err.message });
    }
  }

  return results;
}
