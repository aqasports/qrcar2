import { describe, it, expect } from 'vitest';
import { canAccessFeature, checkResourceLimit, PLAN_CONFIGS } from './gating';

describe('Subscription Gating Engine', () => {
  describe('canAccessFeature', () => {
    it('allows custom cards for pro and enterprise plans, denies for starter', () => {
      expect(canAccessFeature('starter', 'custom_cards')).toBe(false);
      expect(canAccessFeature('pro', 'custom_cards')).toBe(true);
      expect(canAccessFeature('enterprise', 'custom_cards')).toBe(true);
    });

    it('allows whitelabel cards ONLY for enterprise plan', () => {
      expect(canAccessFeature('starter', 'whitelabel_cards')).toBe(false);
      expect(canAccessFeature('pro', 'whitelabel_cards')).toBe(false);
      expect(canAccessFeature('enterprise', 'whitelabel_cards')).toBe(true);
    });

    it('restricts marketplace publishing on starter plan', () => {
      expect(canAccessFeature('starter', 'marketplace_publish')).toBe(false);
      expect(canAccessFeature('pro', 'marketplace_publish')).toBe(true);
      expect(canAccessFeature('enterprise', 'marketplace_publish')).toBe(true);
    });

    it('restricts multi-branch management on starter plan', () => {
      expect(canAccessFeature('starter', 'multi_branch')).toBe(false);
      expect(canAccessFeature('pro', 'multi_branch')).toBe(true);
      expect(canAccessFeature('enterprise', 'multi_branch')).toBe(true);
    });
  });

  describe('checkResourceLimit', () => {
    it('enforces starter seat limit of 3', () => {
      expect(checkResourceLimit('starter', 'seats', 2).allowed).toBe(true);
      expect(checkResourceLimit('starter', 'seats', 3).allowed).toBe(false);
      expect(checkResourceLimit('starter', 'seats', 5).allowed).toBe(false);
    });

    it('enforces pro branch limit of 3', () => {
      expect(checkResourceLimit('pro', 'branches', 2).allowed).toBe(true);
      expect(checkResourceLimit('pro', 'branches', 3).allowed).toBe(false);
    });
  });
});
