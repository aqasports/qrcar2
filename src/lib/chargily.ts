import crypto from 'crypto';

const CHARGILY_API_URL = process.env.CHARGILY_API_URL || 'https://pay.chargily.net/api/v2';
const CHARGILY_SECRET_KEY = process.env.CHARGILY_SECRET_KEY || '';

export interface CreateCheckoutParams {
  amount: number; // in DZD (e.g. 4900, 12900, 29900)
  currency?: 'dzd';
  successUrl: string;
  failureUrl: string;
  webhookEndpoint?: string;
  description?: string;
  metadata: {
    organization_id: string;
    type: 'subscription' | 'card_order';
    plan_id?: string;
    plan_slug?: string;
    card_order_id?: string;
    user_id?: string;
    [key: string]: any;
  };
}

export interface ChargilyCheckoutResponse {
  id: string;
  entity: string;
  livemode: boolean;
  amount: number;
  currency: string;
  fees: number;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'expired';
  checkout_url: string;
  metadata: Record<string, any>;
  created_at: number;
  updated_at: number;
}

/**
 * Creates a Chargily Pay Checkout Session supporting EDAHABIA (BaridiMob) & CIB cards.
 */
export async function createChargilyCheckout(
  params: CreateCheckoutParams
): Promise<ChargilyCheckoutResponse> {
  const secretKey = process.env.CHARGILY_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CHARGILY_SECRET_KEY is not configured in the environment.');
  }

  const payload = {
    amount: Math.round(params.amount),
    currency: params.currency || 'dzd',
    payment_method: 'edahabia', // Supports EDAHABIA / Baridimob & CIB
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    webhook_endpoint:
      params.webhookEndpoint ||
      `${process.env.PUBLIC_BASE_URL || 'https://garage-pro.netlify.app'}/api/webhooks/chargily`,
    description: params.description || 'Abonnement Garage Management Platform',
    metadata: params.metadata,
  };

  const response = await fetch(`${CHARGILY_API_URL}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chargily checkout creation failed:', response.status, errorText);
    throw new Error(`Chargily checkout failed: ${response.statusText} (${errorText})`);
  }

  return (await response.json()) as ChargilyCheckoutResponse;
}

/**
 * Verifies the HMAC-SHA256 signature sent in Chargily webhook `signature` header.
 */
export function verifyChargilyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secretKey = process.env.CHARGILY_SECRET_KEY;
  if (!secretKey || !signatureHeader) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signatureHeader, 'utf8')
    );
  } catch (error) {
    console.error('Failed to verify Chargily webhook signature:', error);
    return false;
  }
}
