import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. PLANS TABLE (Platform Subscription Tiers)
// ==========================================
export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'Starter', 'Pro', 'Enterprise'
  slug: varchar('slug', { length: 50 }).notNull().unique(), // 'starter', 'pro', 'enterprise'
  tier: varchar('tier', { length: 50 }).notNull(), // 'starter', 'pro', 'enterprise'
  maxBranches: integer('max_branches').notNull().default(1),
  maxSeats: integer('max_seats').notNull().default(3),
  cardStudioTier: varchar('card_studio_tier', { length: 50 }).notNull().default('template'), // 'template', 'full', 'full_whitelabel'
  marketplaceListingsPerMonth: integer('marketplace_listings_per_month').notNull().default(0),
  directoryTier: varchar('directory_tier', { length: 50 }).notNull().default('listed'), // 'listed', 'featured', 'spotlight'
  priceMonthly: numeric('price_monthly', { precision: 10, scale: 2 }).notNull().default('0.00'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. ORGANIZATIONS (Garages / Tenants)
// ==========================================
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'restrict' }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).notNull().default('trialing'), // 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodEndsAt: timestamp('current_period_ends_at', { withTimezone: true }),
  // Branding & Configuration
  logoUrl: text('logo_url'),
  brandColorPrimary: varchar('brand_color_primary', { length: 20 }).default('#0f172a'),
  brandColorSecondary: varchar('brand_color_secondary', { length: 20 }).default('#f59e0b'),
  locale: varchar('locale', { length: 10 }).default('fr'), // 'fr', 'ar', 'en'
  currency: varchar('currency', { length: 10 }).default('DZD'),
  timezone: varchar('timezone', { length: 50 }).default('Africa/Algiers'),
  // Professional Directory & SEO
  description: text('description'),
  specialties: jsonb('specialties').default(['diagnostic', 'mecanique']),
  brandsServiced: jsonb('brands_serviced').default(['Toutes Marques']),
  openingHours: jsonb('opening_hours'),
  wilaya: varchar('wilaya', { length: 100 }).default('16 - Alger'),
  city: varchar('city', { length: 100 }).default('Alger'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  gpsLat: numeric('gps_lat', { precision: 10, scale: 7 }),
  gpsLng: numeric('gps_lng', { precision: 10, scale: 7 }),
  isVerifiedPro: boolean('is_verified_pro').default(true).notNull(),
  isDirectoryListed: boolean('is_directory_listed').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. BRANCHES (Per-Organization Locations)
// ==========================================
export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  isMain: boolean('is_main').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_branches_org').on(t.organizationId),
]);

// ==========================================
// 4. USERS (Identity & Authentication)
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. ORGANIZATION MEMBERS (Org-Scoped Roles)
// ==========================================
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'owner', 'super_admin', 'manager', 'technician', 'platform_admin'
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('idx_org_user_unique').on(t.organizationId, t.userId),
  index('idx_org_members_org').on(t.organizationId),
  index('idx_org_members_user').on(t.userId),
]);

// ==========================================
// 6. CLIENTS (Tenant-Scoped Customers)
// ==========================================
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_clients_org').on(t.organizationId),
  index('idx_clients_phone').on(t.organizationId, t.phone),
]);

// ==========================================
// 7. SUPPLIERS (Tenant-Scoped Suppliers)
// ==========================================
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_suppliers_org').on(t.organizationId),
]);

// ==========================================
// 8. VEHICLES (Tenant-Scoped Vehicles)
// ==========================================
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'restrict' }),
  plateNumber: varchar('plate_number', { length: 50 }).notNull(),
  make: varchar('100', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year').notNull(),
  vin: varchar('vin', { length: 100 }),
  color: varchar('color', { length: 50 }),
  currentMileage: integer('current_mileage').notNull().default(0),
  fuelType: varchar('fuel_type', { length: 50 }).default('Diesel'),
  transmission: varchar('transmission', { length: 50 }).default('Manuelle'),
  engineSpec: varchar('engine_spec', { length: 100 }),
  oilType: varchar('oil_type', { length: 50 }).default('5W-30 ACEA C3'),
  tireSize: varchar('tire_size', { length: 50 }),
  nextServiceMileage: integer('next_service_mileage'),
  nextServiceDate: date('next_service_date'),
  nextInspectionDate: date('next_inspection_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_vehicles_org').on(t.organizationId),
  index('idx_vehicles_plate').on(t.organizationId, t.plateNumber),
  index('idx_vehicles_client').on(t.clientId),
]);

// ==========================================
// 9. PVC CARDS (NFC / QR Vehicle Tokens)
// ==========================================
export const pvcCards = pgTable('pvc_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(), // globally unique token for /v/:token
  serialLabel: varchar('serial_label', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('unassigned'), // 'unassigned', 'active', 'revoked', 'lost'
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  linkedAt: timestamp('linked_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_pvc_cards_org').on(t.organizationId),
  index('idx_pvc_cards_status').on(t.organizationId, t.status),
  index('idx_pvc_cards_vehicle').on(t.vehicleId),
]);

// ==========================================
// 10. WORKERS (Technicians & Mechanics)
// ==========================================
export const workers = pgTable('workers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: varchar('role', { length: 100 }).notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  active: boolean('active').notNull().default(true),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_workers_org').on(t.organizationId),
  index('idx_workers_user').on(t.userId),
]);

// ==========================================
// 11. ACTIONS (Interventions & Service Records)
// ==========================================
export const actions = pgTable('actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'restrict' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'repair', 'maintenance', 'inspection', 'other'
  description: text('description').notNull(),
  clientVisibleNotes: text('client_visible_notes'),
  internalNotes: text('internal_notes'),
  mileageAtService: integer('mileage_at_service').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'), // 'open', 'in_progress', 'completed', 'invoiced'
  dateIn: timestamp('date_in', { withTimezone: true }).defaultNow().notNull(),
  dateOut: timestamp('date_out', { withTimezone: true }),
  laborCost: numeric('labor_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_actions_org').on(t.organizationId),
  index('idx_actions_vehicle').on(t.vehicleId),
  index('idx_actions_status').on(t.organizationId, t.status),
]);

// ==========================================
// 12. ACTION WORKERS (Worker Assignments)
// ==========================================
export const actionWorkers = pgTable('action_workers', {
  actionId: uuid('action_id').references(() => actions.id, { onDelete: 'cascade' }).notNull(),
  workerId: uuid('worker_id').references(() => workers.id, { onDelete: 'restrict' }).notNull(),
  roleOnJob: varchar('role_on_job', { length: 50 }).notNull().default('lead'), // 'lead', 'assist'
}, (t) => [
  primaryKey({ columns: [t.actionId, t.workerId] }),
]);

// ==========================================
// 13. PARTS (Inventory Items)
// ==========================================
export const parts = pgTable('parts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull().default('piece'),
  purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
  quantityInStock: integer('quantity_in_stock').notNull().default(0),
  minStockThreshold: integer('min_stock_threshold').notNull().default(5),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_parts_org').on(t.organizationId),
  index('idx_parts_sku').on(t.organizationId, t.sku),
]);

// ==========================================
// 14. ACTION PARTS (Parts Attached to Service)
// ==========================================
export const actionParts = pgTable('action_parts', {
  actionId: uuid('action_id').references(() => actions.id, { onDelete: 'cascade' }).notNull(),
  partId: uuid('part_id').references(() => parts.id, { onDelete: 'restrict' }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.actionId, t.partId] }),
]);

// ==========================================
// 15. STOCK MOVEMENTS (Audit Ledger)
// ==========================================
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  partId: uuid('part_id').references(() => parts.id, { onDelete: 'restrict' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'in', 'out', 'adjustment'
  quantity: integer('quantity').notNull(),
  referenceActionId: uuid('reference_action_id').references(() => actions.id, { onDelete: 'set null' }),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_stock_movements_org').on(t.organizationId),
  index('idx_stock_movements_part').on(t.partId),
]);

// ==========================================
// 16. INVOICES (Billing & Financial Records)
// ==========================================
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  actionId: uuid('action_id').references(() => actions.id, { onDelete: 'restrict' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'issued', 'paid', 'cancelled'
  pdfPath: text('pdf_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_invoices_org').on(t.organizationId),
  uniqueIndex('idx_invoices_number').on(t.organizationId, t.invoiceNumber),
  index('idx_invoices_action').on(t.actionId),
]);

// ==========================================
// 17. INVOICE SEQUENCES (Annual Row Lock)
// ==========================================
export const invoiceSequences = pgTable('invoice_sequences', {
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  year: integer('year').notNull(),
  lastValue: integer('last_value').notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.organizationId, t.year] }),
]);

// ==========================================
// 18. APPOINTMENTS (Rendez-Vous)
// ==========================================
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  serviceType: varchar('service_type', { length: 100 }).notNull(),
  preferredDate: date('preferred_date').notNull(),
  preferredTimeSlot: varchar('preferred_time_slot', { length: 50 }).notNull().default('morning'),
  currentMileage: integer('current_mileage'),
  notes: text('notes'),
  clientPhone: varchar('client_phone', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'confirmed', 'completed', 'cancelled'
  garageResponse: text('garage_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_appointments_org').on(t.organizationId),
  index('idx_appointments_vehicle').on(t.vehicleId),
  index('idx_appointments_status').on(t.organizationId, t.status),
]);

// ==========================================
// 19. REMINDERS (Rappels d'Entretien)
// ==========================================
export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'oil_change', 'inspection', 'timing_belt', 'brakes', 'tires', 'custom'
  title: varchar('title', { length: 255 }).notNull(),
  dueDate: date('due_date'),
  dueMileage: integer('due_mileage'),
  notificationChannel: varchar('notification_channel', { length: 50 }).default('calendar'),
  contactTarget: varchar('contact_target', { length: 100 }),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'completed', 'dismissed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_reminders_org').on(t.organizationId),
  index('idx_reminders_vehicle').on(t.vehicleId),
  index('idx_reminders_status').on(t.organizationId, t.status),
]);

// ==========================================
// 20. AUDIT LOGS (Immutable Operations Audit)
// ==========================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_audit_logs_org').on(t.organizationId),
  index('idx_audit_logs_user').on(t.userId),
]);

// ==========================================
// 21. CARD DESIGNS (PVC Studio Layouts)
// ==========================================
export const cardDesigns = pgTable('card_designs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft', 'submitted', 'approved', 'rejected'
  layoutPreset: varchar('layout_preset', { length: 50 }).default('modern_slate').notNull(),
  frontLogoUrl: text('front_logo_url'),
  frontHeadline: varchar('front_headline', { length: 255 }),
  frontSubheadline: varchar('front_subheadline', { length: 255 }),
  frontBgColor: varchar('front_bg_color', { length: 50 }).default('#0f172a'),
  frontAccentColor: varchar('front_accent_color', { length: 50 }).default('#3b82f6'),
  frontTextColor: varchar('front_text_color', { length: 50 }).default('#ffffff'),
  backBgColor: varchar('back_bg_color', { length: 50 }).default('#0f172a'),
  backTextColor: varchar('back_text_color', { length: 50 }).default('#ffffff'),
  backContactPhone: varchar('back_contact_phone', { length: 100 }),
  backAddress: text('back_address'),
  backEmergencyText: varchar('back_emergency_text', { length: 255 }),
  isWhiteLabel: boolean('is_white_label').default(false).notNull(),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_card_designs_org').on(t.organizationId),
  index('idx_card_designs_status').on(t.status),
]);

// ==========================================
// 22. CARD ORDERS (PVC Fulfillment Engine)
// ==========================================
export const cardOrders = pgTable('card_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'restrict' }).notNull(),
  cardDesignId: uuid('card_design_id').references(() => cardDesigns.id, { onDelete: 'restrict' }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingWilaya: varchar('shipping_wilaya', { length: 100 }).notNull(),
  shippingPhone: varchar('shipping_phone', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending_payment').notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  carrierName: varchar('carrier_name', { length: 100 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_card_orders_org').on(t.organizationId),
  index('idx_card_orders_status').on(t.status),
]);

// ==========================================
// 23. MARKETPLACE LISTINGS (Cross-Tenant Parts)
// ==========================================
export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  partId: uuid('part_id').references(() => parts.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  oemNumber: varchar('oem_number', { length: 100 }),
  category: varchar('category', { length: 100 }).notNull(),
  condition: varchar('condition', { length: 50 }).notNull(), // 'new_oem', 'new_aftermarket', 'used_tested', 'refurbished'
  compatibilityMakes: text('compatibility_makes'),
  compatibilityModels: text('compatibility_models'),
  compatibilityYears: varchar('compatibility_years', { length: 100 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  locationWilaya: varchar('location_wilaya', { length: 100 }).notNull(),
  description: text('description'),
  imageUrls: jsonb('image_urls').default([]),
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active', 'reserved', 'sold', 'archived'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_marketplace_listings_org').on(t.organizationId),
  index('idx_marketplace_listings_status').on(t.status),
  index('idx_marketplace_listings_oem').on(t.oemNumber),
  index('idx_marketplace_listings_category').on(t.category),
  index('idx_marketplace_listings_wilaya').on(t.locationWilaya),
]);

// ==========================================
// 24. MARKETPLACE INQUIRIES (Mechanic to Mechanic)
// ==========================================
export const marketplaceInquiries = pgTable('marketplace_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id').references(() => marketplaceListings.id, { onDelete: 'cascade' }).notNull(),
  buyerOrganizationId: uuid('buyer_organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  sellerOrganizationId: uuid('seller_organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  proposedPrice: numeric('proposed_price', { precision: 10, scale: 2 }),
  buyerPhone: varchar('buyer_phone', { length: 50 }),
  status: varchar('status', { length: 50 }).default('unread').notNull(), // 'unread', 'read', 'replied', 'accepted', 'declined'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_marketplace_inquiries_listing').on(t.listingId),
  index('idx_marketplace_inquiries_buyer').on(t.buyerOrganizationId),
  index('idx_marketplace_inquiries_seller').on(t.sellerOrganizationId),
]);

// ==========================================
// 25. MECHANICAL SOLUTIONS (Knowledge Base & DTC)
// ==========================================
export const mechanicalSolutions = pgTable('mechanical_solutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  dtcCodes: jsonb('dtc_codes').default([]),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  engineCode: varchar('engine_code', { length: 100 }),
  years: varchar('years', { length: 100 }),
  symptoms: text('symptoms').notNull(),
  diagnosticTool: varchar('diagnostic_tool', { length: 100 }),
  rootCause: text('root_cause').notNull(),
  stepByStepFix: text('step_by_step_fix').notNull(),
  partsReplaced: text('parts_replaced'),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  isVerifiedExpert: boolean('is_verified_expert').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_mechanical_solutions_org').on(t.organizationId),
  index('idx_mechanical_solutions_make').on(t.make),
  index('idx_mechanical_solutions_model').on(t.model),
  index('idx_mechanical_solutions_upvotes').on(t.upvotesCount),
]);

// ==========================================
// 26. SOLUTION VOTES (Peer-Review Upvotes)
// ==========================================
export const solutionVotes = pgTable('solution_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => mechanicalSolutions.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  voteType: varchar('vote_type', { length: 20 }).default('upvote').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_solution_votes_solution').on(t.solutionId),
  index('idx_solution_votes_org').on(t.organizationId),
]);

// ==========================================
// 27. CONVERSATIONS (Inter-Garage Chat)
// ==========================================
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgAId: uuid('org_a_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  orgBId: uuid('org_b_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  contextType: varchar('context_type', { length: 50 }).default('general').notNull(), // 'general', 'marketplace_listing', 'mechanical_solution'
  contextId: uuid('context_id'),
  contextTitle: varchar('context_title', { length: 255 }),
  lastMessageText: text('last_message_text'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_conversations_org_a').on(t.orgAId),
  index('idx_conversations_org_b').on(t.orgBId),
  index('idx_conversations_last_msg').on(t.lastMessageAt),
]);

// ==========================================
// 28. DIRECT MESSAGES (Chat Messages Stream)
// ==========================================
export const directMessages = pgTable('direct_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderOrgId: uuid('sender_org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  messageText: text('message_text').notNull(),
  dtcAttachment: varchar('dtc_attachment', { length: 50 }),
  partRefAttachment: varchar('part_ref_attachment', { length: 100 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_direct_messages_conversation').on(t.conversationId),
  index('idx_direct_messages_sender_org').on(t.senderOrgId),
  index('idx_direct_messages_created').on(t.createdAt),
]);

// ==========================================
// 29. VIN CACHE (Decoded Vehicle Specs Cache)
// ==========================================
export const vinCache = pgTable('vin_cache', {
  vin: varchar('vin', { length: 17 }).primaryKey(),
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  trim: varchar('trim', { length: 100 }),
  bodyClass: varchar('body_class', { length: 100 }),
  engineCylinders: varchar('engine_cylinders', { length: 50 }),
  engineDisplacementL: numeric('engine_displacement_l', { precision: 5, scale: 2 }),
  fuelType: varchar('fuel_type', { length: 100 }),
  horsePower: varchar('horse_power', { length: 50 }),
  transmissionStyle: varchar('transmission_style', { length: 100 }),
  plantCountry: varchar('plant_country', { length: 100 }),
  rawData: jsonb('raw_data'),
  cachedAt: timestamp('cached_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_vin_cache_make_model').on(t.make, t.model),
]);

// ==========================================
// 30. NOTIFICATION QUEUE (Multi-Channel Dispatch)
// ==========================================
export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(), // 'email', 'sms', 'whatsapp', 'in_app'
  recipient: varchar('recipient', { length: 255 }).notNull(),
  template: varchar('template', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  payload: jsonb('payload').default({}).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending', 'sent', 'failed', 'retrying'
  attempts: integer('attempts').default(0).notNull(),
  lastError: text('last_error'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_notification_queue_org').on(t.organizationId),
  index('idx_notification_queue_status').on(t.status),
  index('idx_notification_queue_channel').on(t.channel),
  index('idx_notification_queue_created').on(t.createdAt),
]);

// ==========================================
// DRIZZLE RELATIONS DEFINITIONS
// ==========================================
export const organizationRelations = relations(organizations, ({ one, many }) => ({
  plan: one(plans, {
    fields: [organizations.planId],
    references: [plans.id],
  }),
  members: many(organizationMembers),
  branches: many(branches),
  clients: many(clients),
  vehicles: many(vehicles),
  pvcCards: many(pvcCards),
  workers: many(workers),
  actions: many(actions),
  parts: many(parts),
  invoices: many(invoices),
  appointments: many(appointments),
  reminders: many(reminders),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [organizationMembers.branchId],
    references: [branches.id],
  }),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  vehicles: many(vehicles),
}));

export const vehicleRelations = relations(vehicles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vehicles.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [vehicles.clientId],
    references: [clients.id],
  }),
  pvcCards: many(pvcCards),
  actions: many(actions),
  appointments: many(appointments),
  reminders: many(reminders),
}));
