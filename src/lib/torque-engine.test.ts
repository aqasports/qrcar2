import { describe, it, expect } from 'vitest';
import { calculateIsoBoltTorque } from './torque-engine';

describe('Torque Specification Engine (Couples de Serrage)', () => {
  it('calculates ISO 898-1 tightening torque for standard M10 grade 10.9 lubricated bolt', () => {
    const result = calculateIsoBoltTorque('M10', '10.9', 'lubricated');
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.thread).toBe('M10');
    expect(result.diameterMm).toBe(10);
    expect(result.grade).toBe('10.9');
    expect(result.recommendedTorqueNm).toBeGreaterThan(45);
    expect(result.recommendedTorqueNm).toBeLessThan(75);
    expect(result.minTorqueNm).toBeLessThan(result.recommendedTorqueNm);
    expect(result.maxTorqueNm).toBeGreaterThan(result.recommendedTorqueNm);
  });

  it('calculates ISO 898-1 tightening torque for M12 grade 10.9 wheel/chassis bolt', () => {
    const result = calculateIsoBoltTorque('M12', '10.9', 'lubricated');
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.thread).toBe('M12');
    expect(result.recommendedTorqueNm).toBeGreaterThan(80);
    expect(result.recommendedTorqueNm).toBeLessThan(125);
  });

  it('calculates dry vs lubricated differences (dry requires higher torque for equivalent preload)', () => {
    const dry = calculateIsoBoltTorque('M14', '10.9', 'dry');
    const lubricated = calculateIsoBoltTorque('M14', '10.9', 'lubricated');

    expect(dry).not.toBeNull();
    expect(lubricated).not.toBeNull();
    if (!dry || !lubricated) return;

    expect(dry.recommendedTorqueNm).toBeGreaterThan(lubricated.recommendedTorqueNm);
  });

  it('returns null for invalid metric threads', () => {
    const invalid = calculateIsoBoltTorque('M999');
    expect(invalid).toBeNull();
  });
});
