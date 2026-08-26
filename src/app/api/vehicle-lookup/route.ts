import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVehicleTechnicalProfile } from '@/lib/vehicle-api';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from '@/lib/api/response';

// GET /api/vehicle-lookup?vin=... OR ?make=...&model=...&year=...
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(req.url);
  const vin = searchParams.get('vin') || undefined;
  const make = searchParams.get('make') || undefined;
  const model = searchParams.get('model') || undefined;
  const yearStr = searchParams.get('year');
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const engine = searchParams.get('engine') || undefined;

  if (!vin && (!make || !model)) {
    return apiError('Veuillez fournir un VIN ou les champs Marque et Modèle.', 'VALIDATION_ERROR', 400);
  }

  try {
    const profile = await getVehicleTechnicalProfile({
      vin,
      make,
      model,
      year,
      engine,
    });

    if (!profile) {
      return apiError('Impossible de récupérer les caractéristiques techniques du véhicule.', 'NOT_FOUND', 404);
    }

    return apiSuccess(profile);
  } catch (error) {
    console.error('Failed to lookup vehicle profile:', error);
    return apiServerError();
  }
}
