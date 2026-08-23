import bcrypt from 'bcryptjs';
import { sql } from './db';
import { AuthError, ForbiddenError, PlanLimitError } from './errors';
import { logger } from './logger';

export interface ResolvedApiKey {
  apiKeyId: string;
  keyPrefix: string;
  organizationId: string;
  orgName: string;
  orgSlug: string;
  appId: string;
  appName: string;
  appInstallId: string;
  scopes: string[];
  subscriptionStatus: string;
  planSlug: string;
  rateLimitPerMinute: number;
}

/**
 * Resolves an incoming API key Bearer token against the database.
 * Cryptographically verifies bcrypt hash, validates app lifecycle,
 * checks subscription gating, and returns tenant scope.
 */
export async function resolveApiKey(bearerToken: string): Promise<ResolvedApiKey> {
  if (!bearerToken || typeof bearerToken !== 'string') {
    throw new AuthError('Missing or malformed Authorization header');
  }

  const token = bearerToken.startsWith('Bearer ')
    ? bearerToken.slice(7).trim()
    : bearerToken.trim();

  if (!token || token.length < 20) {
    throw new AuthError('Invalid API key format');
  }

  // Extract prefix (e.g., first 16 characters)
  const keyPrefix = token.slice(0, 16);

  // 1. Fetch matching API key candidates by prefix
  const rows = await sql(
    `SELECT 
       ak.id as api_key_id,
       ak.key_prefix,
       ak.hashed_secret,
       ak.scopes as key_scopes,
       ak.revoked_at,
       ai.id as app_install_id,
       ai.status as install_status,
       ai.granted_scopes,
       a.id as app_id,
       a.name as app_name,
       a.status as app_status,
       o.id as organization_id,
       o.name as org_name,
       o.slug as org_slug,
       o.subscription_status,
       o.trial_ends_at,
       p.slug as plan_slug,
       p.tier as plan_tier
     FROM api_keys ak
     JOIN app_installs ai ON ak.app_install_id = ai.id
     JOIN apps a ON ai.app_id = a.id
     JOIN organizations o ON ak.organization_id = o.id
     LEFT JOIN plans p ON o.plan_id = p.id
     WHERE ak.key_prefix = $1
       AND ak.revoked_at IS NULL
     LIMIT 5`,
    [keyPrefix]
  );

  if (!rows || rows.length === 0) {
    throw new AuthError('Invalid or revoked API key');
  }

  // 2. Validate bcrypt hash
  let matchedRow: any = null;
  for (const candidate of rows) {
    try {
      const isMatch = await bcrypt.compare(token, candidate.hashed_secret);
      if (isMatch) {
        matchedRow = candidate;
        break;
      }
    } catch (err) {
      // Continue checking candidates if any
    }
  }

  if (!matchedRow) {
    throw new AuthError('Invalid API key credentials');
  }

  // 3. Validate App and Install Status
  if (matchedRow.app_status === 'suspended') {
    throw new ForbiddenError('This application has been suspended by platform administration');
  }

  if (matchedRow.install_status !== 'active') {
    throw new ForbiddenError('This application is no longer active for the organization');
  }

  // 4. Validate Subscription & Grace Period
  const subStatus = matchedRow.subscription_status || 'trialing';
  const now = new Date();
  const trialEnds = matchedRow.trial_ends_at ? new Date(matchedRow.trial_ends_at) : null;
  const isTrialExpired = subStatus === 'trialing' && trialEnds && now > trialEnds;

  if (subStatus === 'canceled' || subStatus === 'unpaid') {
    throw new PlanLimitError('Organization subscription is suspended. API access is locked.');
  }

  // 5. Compute granted scopes (intersection of key scopes and install granted scopes)
  const keyScopes: string[] = Array.isArray(matchedRow.key_scopes) ? matchedRow.key_scopes : [];
  const grantedScopes: string[] = Array.isArray(matchedRow.granted_scopes) ? matchedRow.granted_scopes : [];
  const effectiveScopes = keyScopes.filter((s) => grantedScopes.includes(s));

  // Determine rate limit by plan tier
  let rateLimitPerMinute = 100; // Starter default
  const tier = matchedRow.plan_tier || 'starter';
  if (tier === 'pro') {
    rateLimitPerMinute = 500;
  } else if (tier === 'enterprise') {
    rateLimitPerMinute = 2000;
  }

  // 6. Asynchronously touch last_used_at
  sql(
    `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
    [matchedRow.api_key_id]
  ).catch((err) => {
    logger.warn('Failed to update api_key last_used_at', { apiKeyId: matchedRow.api_key_id }, err);
  });

  return {
    apiKeyId: matchedRow.api_key_id,
    keyPrefix: matchedRow.key_prefix,
    organizationId: matchedRow.organization_id,
    orgName: matchedRow.org_name,
    orgSlug: matchedRow.org_slug,
    appId: matchedRow.app_id,
    appName: matchedRow.app_name,
    appInstallId: matchedRow.app_install_id,
    scopes: effectiveScopes,
    subscriptionStatus: isTrialExpired ? 'past_due' : subStatus,
    planSlug: matchedRow.plan_slug || 'starter',
    rateLimitPerMinute,
  };
}

/**
 * Asserts that the resolved API key possesses the required scope.
 */
export function assertScope(apiKey: ResolvedApiKey, requiredScope: string): void {
  if (!apiKey.scopes.includes(requiredScope)) {
    throw new ForbiddenError(`Insufficient API scope: missing '${requiredScope}'`);
  }
}
