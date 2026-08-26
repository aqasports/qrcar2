import { describe, it, expect } from 'vitest';
import { STARTER_REPAIR_TEMPLATES } from './seed-templates';

describe('Repair Order Starter Templates Data Model', () => {
  it('contains comprehensive preconfigured workshop templates', () => {
    expect(STARTER_REPAIR_TEMPLATES.length).toBeGreaterThanOrEqual(7);
  });

  it('verifies all templates have valid line items and non-negative default prices', () => {
    for (const tmpl of STARTER_REPAIR_TEMPLATES) {
      expect(tmpl.name).toBeTruthy();
      expect(tmpl.category).toMatch(/^(maintenance|repair|inspection|custom)$/);
      expect(tmpl.default_labor_cost).toBeGreaterThanOrEqual(0);
      expect(tmpl.default_labor_hours).toBeGreaterThan(0);
      expect(Array.isArray(tmpl.line_items)).toBe(true);

      for (const item of tmpl.line_items) {
        expect(item.name).toBeTruthy();
        expect(item.item_type).toMatch(/^(service|part|labor|inspection)$/);
        expect(item.default_unit_price).toBeGreaterThanOrEqual(0);
        expect(item.default_quantity).toBeGreaterThan(0);
        expect(item.unit).toBeTruthy();
      }
    }
  });

  it('includes standard Vidange & Entretien Rapide template with oil, filters and checkpoints', () => {
    const oilService = STARTER_REPAIR_TEMPLATES.find((t) => t.name.includes('Vidange'));
    expect(oilService).toBeDefined();
    if (!oilService) return;

    expect(oilService.category).toBe('maintenance');
    expect(oilService.line_items.some((i) => i.name.includes('Huile'))).toBe(true);
    expect(oilService.line_items.some((i) => i.name.includes('Filtre'))).toBe(true);
    expect(oilService.checkpoints.length).toBeGreaterThan(0);
  });

  it('includes Freinage & Trains Roulants template with brake pads and discs', () => {
    const brakeService = STARTER_REPAIR_TEMPLATES.find((t) => t.name.includes('Freinage'));
    expect(brakeService).toBeDefined();
    if (!brakeService) return;

    expect(brakeService.category).toBe('repair');
    expect(brakeService.line_items.some((i) => i.name.includes('Plaquettes'))).toBe(true);
    expect(brakeService.checkpoints.some((c) => c.category === 'Freinage')).toBe(true);
  });
});
