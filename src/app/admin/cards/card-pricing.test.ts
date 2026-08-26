import { describe, it, expect } from 'vitest';
import { VOLUME_TIERS, ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';

describe('Card Pricing & Algerian Wilayas Logistics', () => {
  it('contains volume pricing tiers starting at 50 units', () => {
    expect(VOLUME_TIERS.length).toBeGreaterThanOrEqual(4);
    expect(VOLUME_TIERS[0].quantity).toBe(50);
    expect(VOLUME_TIERS[0].unitPrice).toBeGreaterThan(0);
  });

  it('provides lower unit cost at higher quantities', () => {
    const tier50 = VOLUME_TIERS.find((t) => t.quantity === 50)!;
    const tier500 = VOLUME_TIERS.find((t) => t.quantity === 500)!;

    expect(tier500.unitPrice).toBeLessThan(tier50.unitPrice);
  });

  it('covers all 58 Algerian Wilayas for Yalidine delivery', () => {
    expect(ALGERIA_WILAYAS.length).toBe(58);
    expect(ALGERIA_WILAYAS[0].code).toBe('01');
    expect(ALGERIA_WILAYAS[0].name).toBe('Adrar');
    expect(ALGERIA_WILAYAS[15].code).toBe('16');
    expect(ALGERIA_WILAYAS[15].name).toBe('Alger');
    expect(ALGERIA_WILAYAS[57].code).toBe('58');
    expect(ALGERIA_WILAYAS[57].name).toBe('El Meniaa');
  });
});
