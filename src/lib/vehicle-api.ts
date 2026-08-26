import { decodeVin, DecodedVinSpecs, validateVin } from '@/lib/vin-decoder';
import { getVehicleTorqueSummary } from '@/lib/torque-engine';

export interface VehicleTechnicalProfile {
  vin?: string;
  make: string;
  model: string;
  year?: number | null;
  trim?: string | null;
  bodyClass?: string | null;
  engineDisplacementL?: number | null;
  engineCylinders?: string | null;
  engineCode?: string | null;
  fuelType?: string | null;
  horsePower?: string | null;
  transmissionStyle?: string | null;
  driveType?: string | null;
  oilTypeRecommended?: string | null;
  tireSizeRecommended?: string | null;
  torqueSummary?: any;
  source: string;
}

/**
 * Common automotive oil grade recommendations mapping based on engine and fuel type
 */
export function getRecommendedOilGrade(fuelType?: string | null, make?: string | null): string {
  const normFuel = (fuelType || '').toLowerCase();
  const normMake = (make || '').toLowerCase();

  if (normMake.includes('renault') || normMake.includes('dacia')) {
    return normFuel.includes('diesel') ? '5W-30 RN0720 / RN17 (C3/C4)' : '5W-40 RN0710';
  }
  if (normMake.includes('peugeot') || normMake.includes('citroen') || normMake.includes('ds')) {
    return normFuel.includes('diesel') ? '0W-30 / 5W-30 PSA B71 2290' : '0W-20 PSA B71 2010';
  }
  if (normMake.includes('volkswagen') || normMake.includes('audi') || normMake.includes('seat') || normMake.includes('skoda')) {
    return normFuel.includes('diesel') ? '5W-30 VW 504.00 / 507.00' : '0W-20 VW 508.00 / 509.00';
  }
  if (normMake.includes('toyota')) {
    return normFuel.includes('diesel') ? '5W-30 ACEA C2' : '0W-20 / 5W-30 API SP';
  }
  if (normMake.includes('hyundai') || normMake.includes('kia')) {
    return normFuel.includes('diesel') ? '5W-30 ACEA C3' : '5W-30 API SN/SP';
  }
  if (normMake.includes('bmw')) {
    return '5W-30 BMW Longlife-04 (LL-04)';
  }
  if (normMake.includes('mercedes')) {
    return '5W-30 MB-Approval 229.51 / 229.52';
  }

  return normFuel.includes('diesel') ? '5W-30 C3 Synthétique' : '5W-40 Synthétique';
}

/**
 * Fetch and assemble complete vehicle technical profile by VIN or Make/Model
 */
export async function getVehicleTechnicalProfile(params: {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
}): Promise<VehicleTechnicalProfile | null> {
  const { vin, make, model, year, engine } = params;

  if (vin && validateVin(vin)) {
    const decoded: DecodedVinSpecs = await decodeVin(vin);
    const finalMake = decoded.make || make || 'Inconnu';
    const finalModel = decoded.model || model || 'Inconnu';
    const finalYear = decoded.year || year || null;
    const finalOil = decoded.oil_type_recommended || getRecommendedOilGrade(decoded.fuel_type, finalMake);

    const torqueSummary = await getVehicleTorqueSummary({
      make: finalMake,
      model: finalModel,
      year: finalYear,
      engine_spec: decoded.engine_code || engine,
      vin,
    });

    return {
      vin: decoded.vin,
      make: finalMake,
      model: finalModel,
      year: finalYear,
      trim: decoded.trim,
      bodyClass: decoded.body_class,
      engineDisplacementL: decoded.engine_displacement_l,
      engineCylinders: decoded.engine_cylinders,
      engineCode: decoded.engine_code,
      fuelType: decoded.fuel_type,
      horsePower: decoded.horse_power,
      transmissionStyle: decoded.transmission_style,
      driveType: decoded.drive_type,
      oilTypeRecommended: finalOil,
      tireSizeRecommended: decoded.tire_size_recommended || 'Standard OE',
      torqueSummary,
      source: decoded.source,
    };
  }

  if (make && model) {
    const oilRec = getRecommendedOilGrade('Diesel', make);
    const torqueSummary = await getVehicleTorqueSummary({
      make,
      model,
      year: year || null,
      engine_spec: engine || null,
    });

    return {
      make,
      model,
      year: year || null,
      oilTypeRecommended: oilRec,
      torqueSummary,
      source: 'database_lookup',
    };
  }

  return null;
}
