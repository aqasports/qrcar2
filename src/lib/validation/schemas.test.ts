import { describe, it, expect } from 'vitest';
import {
  createClientSchema,
  createVehicleSchema,
  createActionSchema,
  createPartSchema,
  adjustStockSchema,
} from './schemas';

describe('Validation Schemas (Zod)', () => {
  describe('createClientSchema', () => {
    it('accepts valid client data', () => {
      const valid = {
        full_name: 'Mohamed Brahimi',
        phone: '0550123456',
        email: 'mohamed@test.com',
        address: 'Alger Centre',
      };
      const result = createClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects client without name or with short phone', () => {
      const invalid = {
        full_name: '',
        phone: '123',
      };
      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createVehicleSchema', () => {
    it('accepts valid automotive vehicle data', () => {
      const valid = {
        plate_number: '00123-116-16',
        make: 'Renault',
        model: 'Clio 4',
        year: 2021,
        current_mileage: 45000,
        fuel_type: 'diesel',
        transmission: 'manuelle',
      };
      const result = createVehicleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects vehicle with invalid year or negative mileage', () => {
      const invalid = {
        plate_number: '00123-116-16',
        make: 'Renault',
        model: 'Clio 4',
        year: 1800,
        current_mileage: -500,
      };
      const result = createVehicleSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createActionSchema', () => {
    it('accepts valid repair order data', () => {
      const valid = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'maintenance',
        description: 'Vidange complète + filtre à huile et filtre à air',
        labor_cost: 2500,
        status: 'in_progress',
      };
      const result = createActionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects action with invalid UUID vehicle_id', () => {
      const invalid = {
        vehicle_id: 'not-a-uuid',
        type: 'repair',
        description: 'Réparation freins',
      };
      const result = createActionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createPartSchema & adjustStockSchema', () => {
    it('accepts valid part and stock adjustment', () => {
      const part = {
        name: 'Plaquettes de frein avant',
        sku: 'BRK-4001',
        purchase_price: 3500,
        sale_price: 5200,
        quantity_in_stock: 12,
        min_stock_threshold: 4,
      };
      expect(createPartSchema.safeParse(part).success).toBe(true);

      const adjust = {
        part_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'in',
        quantity: 10,
        reason: 'Réception commande fournisseur',
      };
      expect(adjustStockSchema.safeParse(adjust).success).toBe(true);
    });
  });
});
