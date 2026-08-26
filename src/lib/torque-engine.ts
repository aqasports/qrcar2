import { sql } from '@/lib/db';

export interface TorqueSpecItem {
  id?: string;
  category: 'wheel_fastener' | 'cylinder_head' | 'spark_plug' | 'standard_bolt' | 'oil_drain' | 'brake_caliper' | 'suspension';
  make?: string | null;
  model?: string | null;
  engine_code?: string | null;
  year_from?: number | null;
  year_to?: number | null;
  component: string;
  torque_nm: number;
  torque_sequence?: string | null;
  thread_spec?: string | null;
  bolt_grade?: string | null;
  notes?: string | null;
  source?: string;
}

export interface IsoBoltCalculationResult {
  thread: string;
  pitchMm: number;
  diameterMm: number;
  grade: '8.8' | '10.9' | '12.9';
  condition: 'dry' | 'lubricated';
  proofStressMpa: number;
  tensileAreaMm2: number;
  clampForceKn: number;
  recommendedTorqueNm: number;
  minTorqueNm: number;
  maxTorqueNm: number;
  formula: string;
}

// ISO 898-1 Metric Fastener Mechanical Properties
const ISO_THREAD_DATA: Record<string, { diameterMm: number; pitchMm: number; tensileAreaMm2: number }> = {
  M4: { diameterMm: 4, pitchMm: 0.7, tensileAreaMm2: 8.78 },
  M5: { diameterMm: 5, pitchMm: 0.8, tensileAreaMm2: 14.2 },
  M6: { diameterMm: 6, pitchMm: 1.0, tensileAreaMm2: 20.1 },
  M7: { diameterMm: 7, pitchMm: 1.0, tensileAreaMm2: 28.9 },
  M8: { diameterMm: 8, pitchMm: 1.25, tensileAreaMm2: 36.6 },
  M10: { diameterMm: 10, pitchMm: 1.5, tensileAreaMm2: 58.0 },
  M12: { diameterMm: 12, pitchMm: 1.75, tensileAreaMm2: 84.3 },
  M14: { diameterMm: 14, pitchMm: 2.0, tensileAreaMm2: 115.0 },
  M16: { diameterMm: 16, pitchMm: 2.0, tensileAreaMm2: 157.0 },
  M18: { diameterMm: 18, pitchMm: 2.5, tensileAreaMm2: 192.0 },
  M20: { diameterMm: 20, pitchMm: 2.5, tensileAreaMm2: 245.0 },
  M22: { diameterMm: 22, pitchMm: 2.5, tensileAreaMm2: 303.0 },
  M24: { diameterMm: 24, pitchMm: 3.0, tensileAreaMm2: 353.0 },
  M27: { diameterMm: 27, pitchMm: 3.0, tensileAreaMm2: 459.0 },
  M30: { diameterMm: 30, pitchMm: 3.5, tensileAreaMm2: 561.0 },
};

const ISO_GRADE_PROOF_STRESS: Record<string, number> = {
  '8.8': 580, // MPa (N/mm2)
  '10.9': 830,
  '12.9': 970,
};

/**
 * Algorithmic ISO 898-1 Fastener Tightening Torque Calculator
 * Formula: T = K * D * F
 * where:
 *   T = Tightening Torque (N.m)
 *   K = Friction Torque Factor (0.15 for lightly oiled/standard, 0.18 for dry/degreased)
 *   D = Nominal Diameter (m)
 *   F = Preload Clamp Force (N) = 75% of Proof Load (As * Sp)
 */
export function calculateIsoBoltTorque(
  thread: string,
  grade: '8.8' | '10.9' | '12.9' = '10.9',
  condition: 'dry' | 'lubricated' = 'lubricated'
): IsoBoltCalculationResult | null {
  const normThread = thread.trim().toUpperCase();
  const threadData = ISO_THREAD_DATA[normThread];
  const proofStress = ISO_GRADE_PROOF_STRESS[grade];

  if (!threadData || !proofStress) {
    return null;
  }

  const kFactor = condition === 'lubricated' ? 0.14 : 0.17;
  // 75% of Proof Stress
  const clampForceN = threadData.tensileAreaMm2 * proofStress * 0.75;
  const clampForceKn = clampForceN / 1000;
  const diameterM = threadData.diameterMm / 1000;

  const rawTorqueNm = kFactor * diameterM * clampForceN;
  const recommendedTorqueNm = Math.round(rawTorqueNm * 10) / 10;
  const minTorqueNm = Math.round(recommendedTorqueNm * 0.9 * 10) / 10;
  const maxTorqueNm = Math.round(recommendedTorqueNm * 1.1 * 10) / 10;

  return {
    thread: normThread,
    pitchMm: threadData.pitchMm,
    diameterMm: threadData.diameterMm,
    grade,
    condition,
    proofStressMpa: proofStress,
    tensileAreaMm2: threadData.tensileAreaMm2,
    clampForceKn: Math.round(clampForceKn * 10) / 10,
    recommendedTorqueNm,
    minTorqueNm,
    maxTorqueNm,
    formula: `T = ${kFactor} × (${threadData.diameterMm}mm / 1000) × (${Math.round(clampForceN)} N) = ${recommendedTorqueNm} N·m`,
  };
}

/**
 * Query Torque Specifications from database
 */
export async function queryTorqueSpecs(params: {
  category?: string;
  make?: string;
  model?: string;
  engineCode?: string;
  search?: string;
  limit?: number;
}): Promise<TorqueSpecItem[]> {
  try {
    let query = `SELECT * FROM torque_specs WHERE 1=1`;
    const values: any[] = [];
    let idx = 1;

    if (params.category && params.category !== 'all') {
      query += ` AND category = $${idx++}`;
      values.push(params.category);
    }

    if (params.make) {
      query += ` AND (make ILIKE $${idx} OR make = 'Universal' OR make = 'ISO Standard')`;
      values.push(`%${params.make}%`);
      idx++;
    }

    if (params.model) {
      query += ` AND (model ILIKE $${idx} OR model IS NULL OR make = 'Universal')`;
      values.push(`%${params.model}%`);
      idx++;
    }

    if (params.engineCode) {
      query += ` AND (engine_code ILIKE $${idx} OR engine_code IS NULL)`;
      values.push(`%${params.engineCode}%`);
      idx++;
    }

    if (params.search) {
      query += ` AND (component ILIKE $${idx} OR notes ILIKE $${idx} OR thread_spec ILIKE $${idx} OR make ILIKE $${idx} OR model ILIKE $${idx})`;
      values.push(`%${params.search}%`);
      idx++;
    }

    query += ` ORDER BY category, make, model LIMIT $${idx}`;
    values.push(params.limit || 50);

    const rows = await sql<TorqueSpecItem>(query, values);
    return rows;
  } catch (error) {
    console.error('Error querying torque specs from DB:', error);
    return [];
  }
}

/**
 * Get comprehensive torque specifications for a specific vehicle
 */
export async function getVehicleTorqueSummary(vehicle: {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine_spec?: string | null;
  vin?: string | null;
}) {
  const make = vehicle.make || '';
  const model = vehicle.model || '';
  const engine = vehicle.engine_spec || '';

  const [wheels, headBolts, sparkPlugs, drainPlugs, calipers, suspension] = await Promise.all([
    queryTorqueSpecs({ category: 'wheel_fastener', make, model, limit: 3 }),
    queryTorqueSpecs({ category: 'cylinder_head', make, engineCode: engine, limit: 3 }),
    queryTorqueSpecs({ category: 'spark_plug', make, limit: 4 }),
    queryTorqueSpecs({ category: 'oil_drain', make, limit: 3 }),
    queryTorqueSpecs({ category: 'brake_caliper', limit: 3 }),
    queryTorqueSpecs({ category: 'suspension', limit: 3 }),
  ]);

  return {
    wheels: wheels.length > 0 ? wheels : await queryTorqueSpecs({ category: 'wheel_fastener', limit: 4 }),
    cylinderHead: headBolts,
    sparkPlugs,
    oilDrain: drainPlugs.length > 0 ? drainPlugs : await queryTorqueSpecs({ category: 'oil_drain', limit: 2 }),
    brakeCalipers: calipers,
    suspension,
  };
}
