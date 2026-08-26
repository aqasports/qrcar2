export interface PlanLimits {
  slug: string;
  name: string;
  maxSeats: number;
  maxBranches: number;
  cardStudioTier: 'template' | 'full' | 'full_whitelabel';
  marketplaceListingsPerMonth: number;
  directoryTier: 'listed' | 'featured' | 'spotlight';
  priceDZD: number;
}

export const PLAN_CONFIGS: Record<string, PlanLimits> = {
  starter: {
    slug: 'starter',
    name: 'Starter Atelier',
    maxSeats: 3,
    maxBranches: 1,
    cardStudioTier: 'template',
    marketplaceListingsPerMonth: 0,
    directoryTier: 'listed',
    priceDZD: 4500,
  },
  pro: {
    slug: 'pro',
    name: 'Pro Performance',
    maxSeats: 10,
    maxBranches: 3,
    cardStudioTier: 'full',
    marketplaceListingsPerMonth: 15,
    directoryTier: 'featured',
    priceDZD: 8500,
  },
  enterprise: {
    slug: 'enterprise',
    name: 'Enterprise Multi-Sites',
    maxSeats: 9999,
    maxBranches: 9999,
    cardStudioTier: 'full_whitelabel',
    marketplaceListingsPerMonth: 9999,
    directoryTier: 'spotlight',
    priceDZD: 16000,
  },
};

/**
 * Checks if a given feature is allowed under the organization's plan
 */
export function canAccessFeature(
  planSlug: string,
  feature: 'custom_cards' | 'whitelabel_cards' | 'marketplace_publish' | 'multi_branch' | 'developer_api'
): boolean {
  const plan = PLAN_CONFIGS[planSlug.toLowerCase()] || PLAN_CONFIGS.starter;

  switch (feature) {
    case 'custom_cards':
      return plan.cardStudioTier === 'full' || plan.cardStudioTier === 'full_whitelabel';
    case 'whitelabel_cards':
      return plan.cardStudioTier === 'full_whitelabel';
    case 'marketplace_publish':
      return plan.marketplaceListingsPerMonth > 0;
    case 'multi_branch':
      return plan.maxBranches > 1;
    case 'developer_api':
      return plan.slug === 'enterprise' || plan.slug === 'pro';
    default:
      return false;
  }
}

/**
 * Verifies resource creation against plan numeric quotas
 */
export function checkResourceLimit(
  planSlug: string,
  resourceType: 'seats' | 'branches' | 'marketplace_listings',
  currentCount: number
): { allowed: boolean; max: number; current: number; reason?: string } {
  const plan = PLAN_CONFIGS[planSlug.toLowerCase()] || PLAN_CONFIGS.starter;

  let max = 0;
  if (resourceType === 'seats') max = plan.maxSeats;
  else if (resourceType === 'branches') max = plan.maxBranches;
  else if (resourceType === 'marketplace_listings') max = plan.marketplaceListingsPerMonth;

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      current: currentCount,
      reason: `Votre forfait ${plan.name} est limité à ${max} ${resourceType}. Veuillez passer au forfait supérieur pour débloquer cette capacité.`,
    };
  }

  return { allowed: true, max, current: currentCount };
}
