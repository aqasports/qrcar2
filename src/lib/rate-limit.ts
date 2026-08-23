import { sql } from './db';
import { logger } from './logger';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  reset: number;
}

interface DurableRateLimitOptions {
  apiKeyId: string;
  organizationId: string;
  method?: string;
  path?: string;
  limit?: number;
  windowSeconds?: number;
}

// In-Memory Fast Cache for edge/local fallback
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Fast in-memory sliding window rate limiter (for edge/IP public /v/:token rate limiting)
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    reset: record.resetTime,
  };
}

/**
 * Durable Database-backed Rate Limiter for Developer API Keys
 * Stores requests in `api_request_log` and calculates live windows.
 */
export async function checkDurableRateLimit(
  options: DurableRateLimitOptions
): Promise<RateLimitResult> {
  const {
    apiKeyId,
    organizationId,
    method = 'GET',
    path = '/api/public/v1',
    limit = 100,
    windowSeconds = 60,
  } = options;

  const now = new Date();
  const windowBucket = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * (windowSeconds * 1000));

  try {
    // 1. Insert current request log entry
    await sql(
      `INSERT INTO api_request_log (api_key_id, organization_id, method, path, window_bucket, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyId, organizationId, method, path, windowBucket.toISOString(), now.toISOString()]
    );

    // 2. Count requests in current window
    const countRows = await sql(
      `SELECT count(*) as count 
       FROM api_request_log 
       WHERE api_key_id = $1 
         AND created_at >= NOW() - ($2 || ' seconds')::INTERVAL`,
      [apiKeyId, windowSeconds.toString()]
    );

    const currentCount = parseInt(countRows[0]?.count || '1', 10);
    const remaining = Math.max(0, limit - currentCount);
    const success = currentCount <= limit;

    return {
      success,
      limit,
      remaining,
      resetSeconds: windowSeconds,
      reset: Date.now() + windowSeconds * 1000,
    };
  } catch (error) {
    logger.warn('Durable rate limit database check failed, falling back to memory store', {
      apiKeyId,
      organizationId,
    }, error);
    // Fallback to memory store if DB is unreachable
    return checkRateLimit(`apikey_${apiKeyId}`, limit, windowSeconds * 1000);
  }
}
