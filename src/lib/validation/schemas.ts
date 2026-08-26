import { z } from 'zod';

// Client Schemas
export const createClientSchema = z.object({
  full_name: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères.').max(100),
  phone: z.string().min(6, 'Numéro de téléphone invalide.').max(25),
  email: z.string().email('Format email invalide.').nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Vehicle Schemas
export const createVehicleSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  plate_number: z.string().min(3, 'Numéro d’immatriculation invalide.').max(30),
  make: z.string().min(1, 'La marque est obligatoire.').max(50),
  model: z.string().min(1, 'Le modèle est obligatoire.').max(50),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 2),
  vin: z.string().length(17, 'Le numéro VIN doit comporter exactement 17 caractères.').nullable().optional().or(z.literal('')),
  color: z.string().max(50).nullable().optional(),
  current_mileage: z.number().int().nonnegative('Le kilométrage ne peut pas être négatif.').default(0),
  fuel_type: z.enum(['diesel', 'essence', 'gpl', 'hybride', 'electrique']).default('diesel'),
  transmission: z.enum(['manuelle', 'automatique', 'robotisee']).default('manuelle'),
  engine_spec: z.string().max(100).nullable().optional(),
  oil_type: z.string().max(50).nullable().optional(),
  tire_size: z.string().max(50).nullable().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// Action / Repair Order Schemas
export const createActionSchema = z.object({
  vehicle_id: z.string().uuid('Identifiant véhicule invalide.'),
  type: z.enum(['repair', 'maintenance', 'inspection', 'other']).default('repair'),
  description: z.string().min(3, 'Veuillez renseigner la description des travaux.').max(1000),
  client_visible_notes: z.string().max(2000).nullable().optional(),
  internal_notes: z.string().max(2000).nullable().optional(),
  mileage_at_service: z.number().int().nonnegative().optional(),
  labor_cost: z.number().nonnegative().default(0),
  status: z.enum(['open', 'in_progress', 'completed', 'invoiced']).default('open'),
  date_in: z.string().optional(),
  date_out: z.string().nullable().optional(),
});

export const updateActionStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'invoiced']),
});

// Part & Stock Schemas
export const createPartSchema = z.object({
  name: z.string().min(2, 'Désignation de pièce obligatoire.').max(150),
  category: z.string().max(50).default('Général'),
  sku: z.string().min(1, 'Référence SKU obligatoire.').max(50),
  unit: z.enum(['piece', 'liter', 'set', 'kg']).default('piece'),
  purchase_price: z.number().nonnegative('Le prix d’achat doit être positif.').default(0),
  sale_price: z.number().nonnegative('Le prix de vente doit être positif.').default(0),
  quantity_in_stock: z.number().int().default(0),
  min_stock_threshold: z.number().int().nonnegative().default(5),
  supplier_id: z.string().uuid().nullable().optional(),
  active: z.boolean().default(true),
});

export const updatePartSchema = createPartSchema.partial();

export const adjustStockSchema = z.object({
  part_id: z.string().uuid('Identifiant pièce invalide.'),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int().positive('La quantité doit être supérieure à zéro.'),
  reason: z.string().max(255).optional(),
});

// Worker Schemas
export const createWorkerSchema = z.object({
  full_name: z.string().min(2, 'Nom du collaborateur obligatoire.').max(100),
  phone: z.string().max(25).nullable().optional(),
  role: z.string().min(2, 'Rôle / spécialité obligatoire.').max(50),
  hourly_rate: z.number().nonnegative().default(1500),
  active: z.boolean().default(true),
  user_id: z.string().uuid().nullable().optional(),
});

export const updateWorkerSchema = createWorkerSchema.partial();

// Appointment Schemas
export const createAppointmentSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  service_type: z.string().min(2).max(100),
  preferred_date: z.string(),
  preferred_time_slot: z.string().max(50).optional(),
  current_mileage: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
  client_phone: z.string().min(6).max(25),
});

// Helper for validating request JSON
export async function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  req: Request
): Promise<{ success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] }> {
  try {
    const json = await req.json();
    const result = schema.safeParse(json);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const firstError = result.error.issues[0]?.message || 'Données invalides.';
    return { success: false, error: firstError, issues: result.error.issues };
  } catch {
    return { success: false, error: 'Corps de requête JSON invalide ou illisible.', issues: [] };
  }
}
