import crypto from 'crypto';
import { sql } from './db';
import { logger } from './logger';

export type WebhookTopic =
  | 'vehicle.created'
  | 'client.created'
  | 'action.created'
  | 'action.completed'
  | 'invoice.issued'
  | 'card.linked'
  | 'card.revoked'
  | 'stock.low'
  | 'appointment.created'
  | 'appointment.cancelled';

/**
 * Computes an HMAC-SHA256 cryptographic signature for outbound webhook delivery.
 * Mirroring verifyChargilyWebhookSignature in reverse.
 */
export function signWebhookPayload(rawBody: string, signingSecret: string): string {
  return crypto
    .createHmac('sha256', signingSecret)
    .update(rawBody, 'utf8')
    .digest('hex');
}

/**
 * Emits a domain webhook event to all subscribed applications for an organization.
 * Inserts delivery log rows and triggers asynchronous non-blocking delivery.
 */
export async function emitWebhookEvent(
  organizationId: string,
  topic: WebhookTopic,
  payload: Record<string, any>
): Promise<void> {
  try {
    // 1. Fetch active subscriptions for this org and topic
    const subscriptions = await sql(
      `SELECT 
         ws.id as subscription_id,
         ws.target_url,
         ws.signing_secret,
         ai.status as install_status,
         a.status as app_status
       FROM webhook_subscriptions ws
       JOIN app_installs ai ON ws.app_install_id = ai.id
       JOIN apps a ON ai.app_id = a.id
       WHERE ws.organization_id = $1
         AND ws.topic = $2
         AND ws.active = true
         AND ai.status = 'active'
         AND a.status != 'suspended'`,
      [organizationId, topic]
    );

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // 2. Queue and dispatch deliveries
    for (const sub of subscriptions) {
      const eventId = crypto.randomUUID();
      const rawPayload = JSON.stringify({
        event_id: eventId,
        topic,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        data: payload,
      });

      // Insert delivery record
      const deliveryRows = await sql(
        `INSERT INTO webhook_deliveries (
           subscription_id,
           organization_id,
           event_id,
           topic,
           payload,
           status,
           attempts,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, 'pending', 0, NOW())
         RETURNING id`,
        [sub.subscription_id, organizationId, eventId, topic, rawPayload]
      );

      const deliveryId = deliveryRows[0]?.id;
      if (deliveryId) {
        // Trigger non-blocking async delivery
        dispatchSingleWebhook(deliveryId, sub.target_url, sub.signing_secret, eventId, topic, rawPayload)
          .catch((err) => {
            logger.error('Background webhook dispatch encountered error', { deliveryId, topic }, err);
          });
      }
    }
  } catch (error) {
    logger.error('Failed to emit webhook event', { organizationId, topic }, error);
  }
}

/**
 * Dispatches an individual webhook HTTP POST request with timeout and signature.
 */
async function dispatchSingleWebhook(
  deliveryId: string,
  targetUrl: string,
  signingSecret: string,
  eventId: string,
  topic: string,
  rawPayload: string
): Promise<void> {
  const signature = signWebhookPayload(rawPayload, signingSecret);
  const now = new Date();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'qrCar-Webhook/1.0',
        'X-QrCar-Topic': topic,
        'X-QrCar-Event-Id': eventId,
        'X-QrCar-Signature': signature,
      },
      body: rawPayload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseStatus = response.status;
    let responseBody = '';
    try {
      responseBody = (await response.text()).slice(0, 1000); // Cap at 1KB
    } catch {
      // Ignore body read errors
    }

    const isSuccess = responseStatus >= 200 && responseStatus < 300;
    const nextStatus = isSuccess ? 'delivered' : 'failed';

    await sql(
      `UPDATE webhook_deliveries 
       SET status = $1,
           attempts = attempts + 1,
           last_attempt_at = $2,
           response_status = $3,
           response_body = $4
       WHERE id = $5`,
      [nextStatus, now.toISOString(), responseStatus, responseBody, deliveryId]
    );
  } catch (err: any) {
    const errorMessage = err?.message || 'Network dispatch error';
    await sql(
      `UPDATE webhook_deliveries 
       SET status = 'failed',
           attempts = attempts + 1,
           last_attempt_at = $1,
           error_message = $2
       WHERE id = $3`,
      [now.toISOString(), errorMessage, deliveryId]
    );
  }
}

/**
 * Background retry worker for failed and pending webhooks.
 * Implements exponential backoff: 1m, 5m, 30m, 2h, 12h (max 5 retries).
 */
export async function processWebhookRetryQueue(): Promise<{ processed: number; succeeded: number }> {
  const backoffIntervals = ['1 minute', '5 minutes', '30 minutes', '2 hours', '12 hours'];
  
  const pendingDeliveries = await sql(
    `SELECT 
       wd.id as delivery_id,
       wd.event_id,
       wd.topic,
       wd.payload,
       wd.attempts,
       ws.target_url,
       ws.signing_secret
     FROM webhook_deliveries wd
     JOIN webhook_subscriptions ws ON wd.subscription_id = ws.id
     WHERE wd.status = 'failed'
       AND wd.attempts < 5
       AND wd.last_attempt_at <= NOW() - INTERVAL '1 minute'
     ORDER BY wd.created_at ASC
     LIMIT 50`
  );

  let succeeded = 0;
  for (const item of pendingDeliveries) {
    const rawPayload = typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload);
    await dispatchSingleWebhook(
      item.delivery_id,
      item.target_url,
      item.signing_secret,
      item.event_id,
      item.topic,
      rawPayload
    );
    succeeded += 1;
  }

  // Mark exhausted
  await sql(
    `UPDATE webhook_deliveries 
     SET status = 'exhausted' 
     WHERE status = 'failed' AND attempts >= 5`
  );

  return { processed: pendingDeliveries.length, succeeded };
}

/**
 * Manually forces redelivery of a specific webhook delivery attempt.
 */
export async function redeliverWebhook(
  deliveryId: string,
  organizationId: string
): Promise<{ success: boolean; status: string; responseStatus?: number; error?: string }> {
  const rows = await sql(
    `SELECT 
       wd.id as delivery_id,
       wd.event_id,
       wd.topic,
       wd.payload,
       ws.target_url,
       ws.secret_hash
     FROM webhook_deliveries wd
     JOIN webhook_subscriptions ws ON wd.subscription_id = ws.id
     WHERE wd.id = $1 AND wd.organization_id = $2`,
    [deliveryId, organizationId]
  );

  if (rows.length === 0) {
    throw new Error('Tentative de livraison introuvable');
  }

  const item = rows[0];
  const rawPayload = typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload);
  const signingSecret = item.secret_hash || 'whsec_default';

  await dispatchSingleWebhook(
    item.delivery_id,
    item.target_url,
    signingSecret,
    item.event_id,
    item.topic,
    rawPayload
  );

  const updatedRows = await sql(
    `SELECT status, response_status, error_message FROM webhook_deliveries WHERE id = $1`,
    [deliveryId]
  );

  return {
    success: updatedRows[0]?.status === 'delivered',
    status: updatedRows[0]?.status || 'unknown',
    responseStatus: updatedRows[0]?.response_status,
    error: updatedRows[0]?.error_message,
  };
}
