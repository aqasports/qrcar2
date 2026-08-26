import { describe, it, expect } from 'vitest';
import { dictionaries, Locale, Dictionary } from './dictionaries';

describe('i18n Dictionaries & Multi-Lingual Architecture', () => {
  const locales: Locale[] = ['fr', 'ar', 'en'];

  it('provides configured dictionaries for French, Arabic, and English', () => {
    locales.forEach((loc) => {
      expect(dictionaries[loc]).toBeDefined();
      expect(typeof dictionaries[loc]).toBe('object');
    });
  });

  it('enforces correct text directions (LTR for FR/EN, RTL for AR)', () => {
    expect(dictionaries.fr.dir).toBe('ltr');
    expect(dictionaries.en.dir).toBe('ltr');
    expect(dictionaries.ar.dir).toBe('rtl');
  });

  const categories: Array<keyof Omit<Dictionary, 'dir'>> = [
    'common',
    'sidebar',
    'cockpit',
    'dashboard',
    'vehicles',
    'clients',
    'actions',
    'inventory',
    'invoices',
    'appointments',
    'cards',
    'marketplace',
    'knowledgebase',
    'messages',
    'workers',
    'portal',
    'billing',
    'settings',
    'login',
  ];

  categories.forEach((category) => {
    it(`guarantees complete key parity in [${category}] across all locales`, () => {
      const frKeys = Object.keys(dictionaries.fr[category]);

      locales.forEach((loc) => {
        const currentKeys = Object.keys(dictionaries[loc][category]);
        expect(currentKeys.sort(), `Key mismatch in category ${category} for locale ${loc}`).toEqual(frKeys.sort());

        // Ensure no empty string translations
        Object.entries(dictionaries[loc][category]).forEach(([k, v]) => {
          expect(v, `Missing value for ${category}.${k} in locale ${loc}`).toBeTruthy();
        });
      });
    });
  });

  it('contains authentic automotive domain Arabic translations', () => {
    expect(dictionaries.ar.common.dashboard).toBe('لوحة القيادة');
    expect(dictionaries.ar.vehicles.title).toContain('أسطول المركبات');
    expect(dictionaries.ar.actions.newAction).toBe('أمر إصلاح جديد');
    expect(dictionaries.ar.portal.digitalPassport).toBe('جواز السفر الرقمي للمركبة');
    expect(dictionaries.ar.billing.payWithBaridiMob).toContain('بريدي موب');
  });
});
