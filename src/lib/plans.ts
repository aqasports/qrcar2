import { sql } from './db';

export interface PlanLimits {
  name: string;
  slug: string;
  tier: string;
  maxBranches: number;
  maxSeats: number;
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
  isSuspended: boolean;
  canWrite: boolean;
  plan: PlanLimits;
  usage: {
    branchesCount: number;
    seatsCount: number;
    marketplaceListingsThisMonth: number;
  };
}

/**
 * Live action feature gating helper. Queries DB in real-time.
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

  // Count active branches
  const branchCountRows = await sql(
    `SELECT COUNT(*) as count FROM branches WHERE organization_id = $1`,
    [organizationId]
  );
  const branchesCount = parseInt(branchCountRows?.[0]?.count || '1', 10);

  // Count active seats (members)
  const memberCountRows = await sql(
    `SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1`,
    [organizationId]
  );
  const seatsCount = parseInt(memberCountRows?.[0]?.count || '1', 10);

  // Status flags
  const status = org.subscription_status || 'trialing';
  const now = new Date();
  const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const isTrialExpired = status === 'trialing' && trialEnds && now > trialEnds;

  const isPastDue = status === 'past_due' || Boolean(isTrialExpired);
  const isSuspended = status === 'canceled' || status === 'unpaid';
  const canWrite = !isPastDue && !isSuspended;

  const plan: PlanLimits = {
    name: org.plan_name || 'Starter',
    slug: org.plan_slug || 'starter',
    tier: org.plan_tier || 'starter',
    maxBranches: parseInt(org.max_branches || '1', 10),
    maxSeats: parseInt(org.max_seats || '3', 10),
    cardStudioTier: (org.card_studio_tier || 'template') as any,
    marketplaceListingsPerMonth: parseInt(org.marketplace_listings_per_month || '0', 10),
    directoryTier: (org.directory_tier || 'listed') as any,
    priceMonthly: parseFloat(org.price_monthly || '4900.00'),
  };

  return {
    organizationId: org.organization_id,
    orgName: org.org_name,
    subscriptionStatus: isTrialExpired ? 'past_due' : status,
    trialEndsAt: org.trial_ends_at,
    currentPeriodEndsAt: org.current_period_ends_at,
    isTrial: status === 'trialing' && !isTrialExpired,
    isPastDue,
    isSuspended,
    canWrite,
    plan,
    usage: {
      branchesCount,
      seatsCount,
      marketplaceListingsThisMonth: 0,
    },
  };
}

/**
 * Live action gating checker.
 */
export async function assertActionAllowed(
  organizationId: string,
  actionType: 'add_branch' | 'add_seat' | 'custom_card_studio' | 'create_marketplace_listing' | 'start_conversation'
): Promise<{ allowed: boolean; reason?: string }> {
  const details = await getOrganizationPlanDetails(organizationId);

  if (!details.canWrite) {
    return {
      allowed: false,
      reason: 'Votre abonnement a expiré ou nécessite un règlement via BaridiMob / EDAHABIA.',
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

  return { allowed: true };
}
