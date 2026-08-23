import { sql } from './db';

export interface PlanLimits {
  name: string;
  slug: string;
  tier: string;
  maxBranches: number;
  maxSeats: number;
  maxApiCallsPerMonth: number;
  cardStudioTier: 'template' | 'full' | 'full_whitelabel';
  marketplaceListingsPerMonth: number;
  directoryTier: 'listed' | 'featured' | 'spotlight';
  priceMonthly: number;
}

export interface OrganizationPlanDetails {
  organizationId: string;
  orgName: string;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  isTrial: boolean;
  isPastDue: boolean;
  isGracePeriod: boolean;
  graceDaysRemaining: number;
  isSuspended: boolean;
  canWrite: boolean;
  dunningNotice: string | null;
  plan: PlanLimits;
  usage: {
    branchesCount: number;
    seatsCount: number;
    apiCallsThisMonth: number;
    marketplaceListingsThisMonth: number;
    apiQuotaPercent: number;
    isApiQuotaWarning: boolean;
    isApiQuotaExceeded: boolean;
  };
}

/**
 * Live action feature gating & usage metering helper. Queries DB in real-time.
 */
export async function getOrganizationPlanDetails(
  organizationId: string
): Promise<OrganizationPlanDetails> {
  const orgRows = await sql(
    `
    SELECT 
      o.id as organization_id,
      o.name as org_name,
      o.subscription_status,
      o.trial_ends_at,
      o.current_period_ends_at,
      p.name as plan_name,
      p.slug as plan_slug,
      p.tier as plan_tier,
      p.max_branches,
      p.max_seats,
      p.card_studio_tier,
      p.marketplace_listings_per_month,
      p.directory_tier,
      p.price_monthly
    FROM organizations o
    LEFT JOIN plans p ON o.plan_id = p.id
    WHERE o.id = $1
    LIMIT 1
  `,
    [organizationId]
  );

  if (orgRows.length === 0) {
    throw new Error(`Organization ${organizationId} not found.`);
  }

  const org = orgRows[0];

  // 1. Count active branches
  const branchCountRows = await sql(
    `SELECT COUNT(*) as count FROM branches WHERE organization_id = $1`,
    [organizationId]
  );
  const branchesCount = parseInt(branchCountRows?.[0]?.count || '1', 10);

  // 2. Count active seats (members)
  const memberCountRows = await sql(
    `SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1`,
    [organizationId]
  );
  const seatsCount = parseInt(memberCountRows?.[0]?.count || '1', 10);

  // 3. Count API calls consumed this calendar month
  let apiCallsThisMonth = 0;
  try {
    const apiLogRows = await sql(
      `SELECT COUNT(*) as count 
       FROM api_request_log 
       WHERE organization_id = $1 
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [organizationId]
    );
    apiCallsThisMonth = parseInt(apiLogRows?.[0]?.count || '0', 10);
  } catch {
    // In case table is still initializing
  }

  // 4. Count Marketplace listings created this month
  let marketplaceListingsThisMonth = 0;
  try {
    const mpRows = await sql(
      `SELECT COUNT(*) as count 
       FROM marketplace_listings 
       WHERE organization_id = $1 
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [organizationId]
    );
    marketplaceListingsThisMonth = parseInt(mpRows?.[0]?.count || '0', 10);
  } catch {
    // Ignored
  }

  // 5. Subscription Status & Grace Period Calculation
  const status = org.subscription_status || 'trialing';
  const now = new Date();
  const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const currentPeriodEnds = org.current_period_ends_at ? new Date(org.current_period_ends_at) : null;

  const isTrialExpired = status === 'trialing' && trialEnds && now > trialEnds;
  const isPeriodExpired = status === 'active' && currentPeriodEnds && now > currentPeriodEnds;
  const isPastDue = status === 'past_due' || Boolean(isTrialExpired) || Boolean(isPeriodExpired);

  let expiryDate = trialEnds;
  if (status === 'active' && currentPeriodEnds) expiryDate = currentPeriodEnds;

  let isGracePeriod = false;
  let graceDaysRemaining = 0;
  let dunningNotice: string | null = null;

  if (isPastDue && expiryDate) {
    const diffMs = now.getTime() - expiryDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      isGracePeriod = true;
      graceDaysRemaining = Math.max(1, 7 - diffDays);
      dunningNotice = `Période de grâce active : il vous reste ${graceDaysRemaining} jour(s) pour régulariser votre abonnement sans interruption d'activité.`;
    } else {
      dunningNotice = 'Période de grâce expirée. Votre atelier est en mode lecture seule. Veuillez régler votre abonnement.';
    }
  }

  const isSuspended = status === 'canceled' || status === 'unpaid';
  // Can write if active or during the 7-day grace period
  const canWrite = !isSuspended && (!isPastDue || isGracePeriod);

  // Plan limits by tier
  const tier = org.plan_tier || 'starter';
  let maxApiCalls = 10000;
  if (tier === 'pro') maxApiCalls = 100000;
  else if (tier === 'enterprise') maxApiCalls = 1000000;

  const plan: PlanLimits = {
    name: org.plan_name || 'Starter',
    slug: org.plan_slug || 'starter',
    tier,
    maxBranches: parseInt(org.max_branches || '1', 10),
    maxSeats: parseInt(org.max_seats || '3', 10),
    maxApiCallsPerMonth: maxApiCalls,
    cardStudioTier: (org.card_studio_tier || 'template') as any,
    marketplaceListingsPerMonth: parseInt(org.marketplace_listings_per_month || '0', 10),
    directoryTier: (org.directory_tier || 'listed') as any,
    priceMonthly: parseFloat(org.price_monthly || '4900.00'),
  };

  const apiQuotaPercent = Math.min(100, Math.round((apiCallsThisMonth / maxApiCalls) * 100));
  const isApiQuotaWarning = apiQuotaPercent >= 80;
  const isApiQuotaExceeded = apiCallsThisMonth >= maxApiCalls;

  return {
    organizationId: org.organization_id,
    orgName: org.org_name,
    subscriptionStatus: isPastDue ? 'past_due' : status,
    trialEndsAt: org.trial_ends_at,
    currentPeriodEndsAt: org.current_period_ends_at,
    isTrial: status === 'trialing' && !isTrialExpired,
    isPastDue,
    isGracePeriod,
    graceDaysRemaining,
    isSuspended,
    canWrite,
    dunningNotice,
    plan,
    usage: {
      branchesCount,
      seatsCount,
      apiCallsThisMonth,
      marketplaceListingsThisMonth,
      apiQuotaPercent,
      isApiQuotaWarning,
      isApiQuotaExceeded,
    },
  };
}

/**
 * Live action gating checker with strict grace period and quota enforcement.
 */
export async function assertActionAllowed(
  organizationId: string,
  actionType: 'add_branch' | 'add_seat' | 'custom_card_studio' | 'create_marketplace_listing' | 'api_call'
): Promise<{ allowed: boolean; reason?: string }> {
  const details = await getOrganizationPlanDetails(organizationId);

  if (!details.canWrite) {
    return {
      allowed: false,
      reason: 'Votre abonnement a expiré. Veuillez régulariser votre forfait via BaridiMob / EDAHABIA (Chargily Pay).',
    };
  }

  if (actionType === 'add_branch') {
    if (details.usage.branchesCount >= details.plan.maxBranches) {
      return {
        allowed: false,
        reason: `Limite de succursales atteinte (${details.usage.branchesCount}/${details.plan.maxBranches}). Veuillez passer au forfait supérieur.`,
      };
    }
  }

  if (actionType === 'add_seat') {
    if (details.usage.seatsCount >= details.plan.maxSeats) {
      return {
        allowed: false,
        reason: `Limite d'utilisateurs atteinte (${details.usage.seatsCount}/${details.plan.maxSeats}). Veuillez passer au forfait Pro ou Enterprise.`,
      };
    }
  }

  if (actionType === 'custom_card_studio') {
    if (details.plan.cardStudioTier === 'template') {
      return {
        allowed: false,
        reason: 'Le studio de design sur mesure nécessite un forfait Pro ou Enterprise.',
      };
    }
  }

  if (actionType === 'create_marketplace_listing') {
    if (details.plan.marketplaceListingsPerMonth === 0) {
      return {
        allowed: false,
        reason: 'La publication d\'annonces sur la marketplace pièces nécessite un forfait Pro ou Enterprise.',
      };
    }
  }

  if (actionType === 'api_call') {
    if (details.usage.isApiQuotaExceeded) {
      return {
        allowed: false,
        reason: `Quota mensuel d'appels API atteint (${details.usage.apiCallsThisMonth}/${details.plan.maxApiCallsPerMonth}). Passez au forfait Pro ou Enterprise.`,
      };
    }
  }

  return { allowed: true };
}
