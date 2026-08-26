import { describe, it, expect } from 'vitest';
import { validateVin, decodeModelYear, decodeVin } from './vin-decoder';

describe('High-Precision VIN Decoder Engine', () => {
  describe('validateVin', () => {
    it('accepts valid 17-character ISO 3779 VINs', () => {
      expect(validateVin('WBA3D3108DF123456')).toBe(true);
      expect(validateVin('VF1BH0A0F12345678')).toBe(true);
    });

    it('rejects invalid lengths or forbidden characters (I, O, Q)', () => {
      expect(validateVin('WBA3D3108DF12345')).toBe(false); // 16 chars
      expect(validateVin('WBA3D3108DF1234567')).toBe(false); // 18 chars
      expect(validateVin('WBAI3D3108DF12345')).toBe(false); // contains I
      expect(validateVin('WBAO3D3108DF12345')).toBe(false); // contains O
      expect(validateVin('WBAQ3D3108DF12345')).toBe(false); // contains Q
    });
  });

  describe('decodeModelYear', () => {
    it('correctly maps 10th VIN character to standard model years', () => {
      expect(decodeModelYear('1')).toBe(2001);
      expect(decodeModelYear('9')).toBe(2009);
      expect(decodeModelYear('A')).toBe(2010);
      expect(decodeModelYear('D')).toBe(2013);
      expect(decodeModelYear('G')).toBe(2016);
      expect(decodeModelYear('L')).toBe(2020);
      expect(decodeModelYear('N')).toBe(2022);
      expect(decodeModelYear('P')).toBe(2023);
      expect(decodeModelYear('R')).toBe(2024);
      expect(decodeModelYear('S')).toBe(2025);
    });
  });

  describe('decodeVin European & Global VDS Matching', () => {
    it('decodes BMW Series 3 (F30) with rich mechanical telemetry', async () => {
      // 10th char 'G' -> 2016
      const result = await decodeVin('WBA3D3108GF123456');

      expect(result.make).toBe('BMW');
      expect(result.model).toContain('Série 3');
      expect(result.year).toBe(2016);
      expect(result.fuel_type).toBe('Diesel');
      expect(result.engine_displacement_l).toBe(2.0);
      expect(result.oil_type_recommended).toContain('BMW Longlife-04');
      expect(result.tire_size_recommended).toContain('225');
      expect(result.plant_country).toContain('Allemagne');
    });

    it('decodes BMW X5 (G05) with 3.0L Diesel telemetry', async () => {
      // 10th char 'L' -> 2020
      const result = await decodeVin('WBAKR1109LF123456');

      expect(result.make).toBe('BMW');
      expect(result.model).toContain('X5');
      expect(result.year).toBe(2020);
      expect(result.engine_displacement_l).toBe(3.0);
      expect(result.horse_power).toContain('ch');
      expect(result.oil_type_recommended).toContain('BMW Longlife-04');
    });

    it('decodes Renault Clio 4 with 1.5 dCi telemetry', async () => {
      // 10th char 'E' -> 2014
      const result = await decodeVin('VF1BH0A05EF123456');

      expect(result.make).toBe('Renault');
      expect(result.model).toContain('Clio');
      expect(result.year).toBe(2014);
      expect(result.fuel_type).toBe('Diesel');
      expect(result.oil_type_recommended).toContain('RN0720');
      expect(result.plant_country).toContain('France');
    });

    it('decodes Volkswagen Golf with 2.0 TDI & 507.00 oil telemetry', async () => {
      // 10th char 'H' -> 2017
      const result = await decodeVin('WVWZZZ5GZHW123456');

      expect(result.make).toBe('Volkswagen');
      expect(result.model).toContain('Golf');
      expect(result.year).toBe(2017);
      expect(result.oil_type_recommended).toContain('507.00');
    });

    it('decodes Peugeot 208 with BlueHDi telemetry', async () => {
      // 10th char 'J' -> 2018
      const result = await decodeVin('VF3CA9HP0JW123456');

      expect(result.make).toBe('Peugeot');
      expect(result.model).toContain('208');
      expect(result.year).toBe(2018);
      expect(result.oil_type_recommended).toContain('PSA B71');
    });

    it('decodes Hyundai Accent with CRDi telemetry', async () => {
      // 10th char 'K' -> 2019
      const result = await decodeVin('KMHCT41EBKU123456');

      expect(result.make).toBe('Hyundai');
      expect(result.model).toContain('Accent');
      expect(result.year).toBe(2019);
      expect(result.fuel_type).toBe('Diesel');
      expect(result.plant_country).toContain('Algérie');
    });
  });
});
