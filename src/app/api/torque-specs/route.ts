import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  queryTorqueSpecs,
  calculateIsoBoltTorque,
  getVehicleTorqueSummary,
} from '@/lib/torque-engine';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from '@/lib/api/response';

// GET /api/torque-specs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const make = searchParams.get('make') || undefined;
  const model = searchParams.get('model') || undefined;
  const engineCode = searchParams.get('engine_code') || searchParams.get('engine') || undefined;
  const search = searchParams.get('search') || searchParams.get('q') || undefined;
  const thread = searchParams.get('thread');
  const grade = (searchParams.get('grade') || '10.9') as '8.8' | '10.9' | '12.9';
  const condition = (searchParams.get('condition') || 'lubricated') as 'dry' | 'lubricated';
  const vehicleSummary = searchParams.get('vehicle_summary');

  try {
    // 1. If ISO calculation requested
    if (thread) {
      const calcResult = calculateIsoBoltTorque(thread, grade, condition);
      if (!calcResult) {
        return apiError(`Filetage métrique ISO non reconnu : "${thread}". Utilisez M6, M8, M10, M12, M14, M16, etc.`, 'BAD_REQUEST', 400);
      }
      return apiSuccess({
        calculation: calcResult,
      });
    }

    // 2. If full vehicle summary requested
    if (vehicleSummary === 'true' || vehicleSummary === '1') {
      const summary = await getVehicleTorqueSummary({
        make,
        model,
        engine_spec: engineCode,
      });
      return apiSuccess({
        summary,
      });
    }

    // 3. General query
    const results = await queryTorqueSpecs({
      category,
      make,
      model,
      engineCode,
      search,
      limit: 60,
    });

    return apiSuccess({
      count: results.length,
      specs: results,
    });
  } catch (error) {
    console.error('Failed to query torque specs:', error);
    return apiServerError();
  }
}
