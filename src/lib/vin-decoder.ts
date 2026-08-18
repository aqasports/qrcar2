import { sql } from '@/lib/db';

export interface DecodedVinSpecs {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  body_class: string | null;
  engine_cylinders: string | null;
  engine_displacement_l: number | null;
  fuel_type: string | null;
  horse_power: string | null;
  transmission_style: string | null;
  plant_country: string | null;
  source: 'cache' | 'nhtsa' | 'commercial';
}

/**
 * Validates a 17-character VIN according to ISO 3779
 * (No letters I, O, Q allowed)
 */
export function validateVin(vin: string): boolean {
  if (!vin) return false;
  const clean = vin.trim().toUpperCase();
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(clean);
}

/**
 * Normalizes fuel type strings to standard terminology
 */
function normalizeFuelType(fuel: string | null): string {
  if (!fuel) return 'Diesel';
  const lower = fuel.toLowerCase();
  if (lower.includes('diesel')) return 'Diesel';
  if (lower.includes('gasoline') || lower.includes('petrol') || lower.includes('essence')) return 'Essence';
  if (lower.includes('electric') || lower.includes('électrique')) return 'Électrique';
  if (lower.includes('hybrid') || lower.includes('hybride')) return 'Hybride';
  if (lower.includes('cng') || lower.includes('lpg') || lower.includes('gpl')) return 'GPL';
  return fuel;
}

/**
 * Pluggable VIN Decoding Engine
 * Layer 3: Local Cache -> Layer 1: NHTSA vPIC -> Layer 2: Commercial / Custom Fallback
 */
export async function decodeVin(rawVin: string): Promise<DecodedVinSpecs> {
  const cleanVin = rawVin.trim().toUpperCase();

  if (!validateVin(cleanVin)) {
    throw new Error('Le numéro de châssis (VIN) doit comporter exactement 17 caractères conformes ISO 3779.');
  }

  // Layer 3: Persistent Local Database Cache
  try {
    const cachedRows = await sql(
      `SELECT * FROM vin_cache WHERE vin = $1 LIMIT 1`,
      [cleanVin]
    );

    if (cachedRows.length > 0) {
      const row = cachedRows[0];
      return {
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year ? parseInt(row.year, 10) : null,
        trim: row.trim,
        body_class: row.body_class,
        engine_cylinders: row.engine_cylinders,
        engine_displacement_l: row.engine_displacement_l ? parseFloat(row.engine_displacement_l) : null,
        fuel_type: row.fuel_type,
        horse_power: row.horse_power,
        transmission_style: row.transmission_style,
        plant_country: row.plant_country,
        source: 'cache',
      };
    }
  } catch (err) {
    console.warn('VIN Cache lookup failed, falling back to live API:', err);
  }

  // Layer 1: NHTSA vPIC Global Vehicle API
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      const item = data?.Results?.[0];

      if (item && item.Make) {
        const make = item.Make ? item.Make.trim() : null;
        const model = item.Model ? item.Model.trim() : null;
        const year = item.ModelYear && !isNaN(parseInt(item.ModelYear, 10)) ? parseInt(item.ModelYear, 10) : null;
        const trim = item.Trim ? item.Trim.trim() : null;
        const bodyClass = item.BodyClass ? item.BodyClass.trim() : null;
        const engineCylinders = item.EngineCylinders ? item.EngineCylinders.trim() : null;
        const engineDisplacementL = item.DisplacementL && !isNaN(parseFloat(item.DisplacementL))
          ? parseFloat(parseFloat(item.DisplacementL).toFixed(2))
          : null;
        const fuelType = normalizeFuelType(item.FuelTypePrimary || item.FuelTypeSecondary);
        const horsePower = item.EngineHP ? item.EngineHP.trim() : null;
        const transmissionStyle = item.TransmissionStyle ? item.TransmissionStyle.trim() : null;
        const plantCountry = item.PlantCountry ? item.PlantCountry.trim() : null;

        // Persist to Layer 3 Database Cache
        await sql(
          `
          INSERT INTO vin_cache (
            vin, make, model, year, trim, body_class,
            engine_cylinders, engine_displacement_l, fuel_type,
            horse_power, transmission_style, plant_country, raw_data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (vin) DO UPDATE SET
            make = EXCLUDED.make,
            model = EXCLUDED.model,
            year = EXCLUDED.year,
            cached_at = CURRENT_TIMESTAMP
        `,
          [
            cleanVin,
            make,
            model,
            year,
            trim,
            bodyClass,
            engineCylinders,
            engineDisplacementL,
            fuelType,
            horsePower,
            transmissionStyle,
            plantCountry,
            JSON.stringify(item),
          ]
        );

        return {
          vin: cleanVin,
          make,
          model,
          year,
          trim,
          body_class: bodyClass,
          engine_cylinders: engineCylinders,
          engine_displacement_l: engineDisplacementL,
          fuel_type: fuelType,
          horse_power: horsePower,
          transmission_style: transmissionStyle,
          plant_country: plantCountry,
          source: 'nhtsa',
        };
      }
    }
  } catch (err) {
    console.error('NHTSA vPIC VIN decode error:', err);
  }

  // Layer 2: Pluggable Commercial Decoder / WMI Fallback
  const wmi = cleanVin.slice(0, 3);
  let guessedMake = 'Véhicule';
  let guessedCountry = 'Europe';

  if (wmi.startsWith('VF1') || wmi.startsWith('VF2')) {
    guessedMake = 'Renault';
    guessedCountry = 'France';
  } else if (wmi.startsWith('VF3') || wmi.startsWith('VF7')) {
    guessedMake = 'Peugeot';
    guessedCountry = 'France';
  } else if (wmi.startsWith('WVW') || wmi.startsWith('WAU') || wmi.startsWith('VSS') || wmi.startsWith('TMB')) {
    guessedMake = 'Volkswagen';
    guessedCountry = 'Allemagne';
  } else if (wmi.startsWith('WBA') || wmi.startsWith('WBY')) {
    guessedMake = 'BMW';
    guessedCountry = 'Allemagne';
  } else if (wmi.startsWith('WDB') || wmi.startsWith('WDC')) {
    guessedMake = 'Mercedes-Benz';
    guessedCountry = 'Allemagne';
  } else if (wmi.startsWith('JT') || wmi.startsWith('SB1')) {
    guessedMake = 'Toyota';
    guessedCountry = 'Japon';
  } else if (wmi.startsWith('KMH') || wmi.startsWith('KNA')) {
    guessedMake = 'Hyundai';
    guessedCountry = 'Corée du Sud';
  }

  return {
    vin: cleanVin,
    make: guessedMake,
    model: null,
    year: null,
    trim: null,
    body_class: null,
    engine_cylinders: null,
    engine_displacement_l: null,
    fuel_type: 'Diesel',
    horse_power: null,
    transmission_style: null,
    plant_country: guessedCountry,
    source: 'commercial',
  };
}
