-- database/migrations/0003_multi_tenancy_retrofit.sql
-- Multi-Tenant SaaS Retrofit: Schema, Backfill Default Garage, and PostgreSQL Row-Level Security (RLS)

-- 1. Create Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  tier VARCHAR(50) NOT NULL,
  max_branches INT NOT NULL DEFAULT 1,
  max_seats INT NOT NULL DEFAULT 3,
  card_studio_tier VARCHAR(50) NOT NULL DEFAULT 'template',
  marketplace_listings_per_month INT NOT NULL DEFAULT 0,
  directory_tier VARCHAR(50) NOT NULL DEFAULT 'listed',
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stripe_price_id VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Subscription Plans
INSERT INTO plans (id, name, slug, tier, max_branches, max_seats, card_studio_tier, marketplace_listings_per_month, directory_tier, price_monthly)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Starter', 'starter', 'starter', 1, 3, 'template', 0, 'listed', 49.00),
  ('10000000-0000-0000-0000-000000000002', 'Pro', 'pro', 'pro', 3, 15, 'full', 20, 'featured', 129.00),
  ('10000000-0000-0000-0000-000000000003', 'Enterprise', 'enterprise', 'enterprise', 999999, 999999, 'full_whitelabel', 999999, 'spotlight', 299.00)
ON CONFLICT (slug) DO UPDATE SET
  tier = EXCLUDED.tier,
  max_branches = EXCLUDED.max_branches,
  max_seats = EXCLUDED.max_seats,
  card_studio_tier = EXCLUDED.card_studio_tier,
  marketplace_listings_per_month = EXCLUDED.marketplace_listings_per_month,
  directory_tier = EXCLUDED.directory_tier,
  price_monthly = EXCLUDED.price_monthly;

-- 2. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_ends_at TIMESTAMP WITH TIME ZONE,
  logo_url TEXT,
  brand_color_primary VARCHAR(20) DEFAULT '#0f172a',
  brand_color_secondary VARCHAR(20) DEFAULT '#f59e0b',
  locale VARCHAR(10) DEFAULT 'fr',
  currency VARCHAR(10) DEFAULT 'DZD',
  timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Update Users Table with Platform Admin Flag & Email
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Create Organization Members Table (Org-scoped roles)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'super_admin', 'manager', 'technician', 'platform_admin')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, user_id)
);

-- 6. Insert Default Organization (to preserve existing data seamlessly)
INSERT INTO organizations (id, name, slug, plan_id, subscription_status, brand_color_primary, brand_color_secondary, locale, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Garage',
  'default-garage',
  '10000000-0000-0000-0000-000000000002', -- Pro Plan
  'active',
  '#0f172a',
  '#f59e0b',
  'fr',
  'DZD'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Default Branch
INSERT INTO branches (id, organization_id, name, is_main)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Siège Principal', true)
ON CONFLICT (id) DO NOTHING;

-- Map existing users to Default Organization in organization_members
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001' AS organization_id,
  id AS user_id,
  CASE 
    WHEN role = 'super_admin' THEN 'owner'
    WHEN role = 'manager' THEN 'manager'
    WHEN role = 'technician' THEN 'technician'
    ELSE 'technician'
  END AS role
FROM users
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 7. Add organization_id to All Tenant Tables and Backfill

-- Clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE suppliers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE suppliers ALTER COLUMN organization_id SET NOT NULL;

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE vehicles SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE vehicles ALTER COLUMN organization_id SET NOT NULL;

-- PVC Cards
ALTER TABLE pvc_cards ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE pvc_cards SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE pvc_cards ALTER COLUMN organization_id SET NOT NULL;

-- Workers
ALTER TABLE workers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE workers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE workers ALTER COLUMN organization_id SET NOT NULL;

-- Actions
ALTER TABLE actions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE actions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE actions ALTER COLUMN organization_id SET NOT NULL;

-- Parts
ALTER TABLE parts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE parts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE parts ALTER COLUMN organization_id SET NOT NULL;

-- Stock Movements
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE stock_movements SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE stock_movements ALTER COLUMN organization_id SET NOT NULL;

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;

-- Invoice Sequences (convert to multi-tenant per org & year)
ALTER TABLE invoice_sequences ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
UPDATE invoice_sequences SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE invoice_sequences ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invoice_sequences DROP CONSTRAINT IF EXISTS invoice_sequences_pkey;
ALTER TABLE invoice_sequences ADD PRIMARY KEY (organization_id, year);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE appointments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE appointments ALTER COLUMN organization_id SET NOT NULL;

-- Reminders
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE reminders SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE reminders ALTER COLUMN organization_id SET NOT NULL;

-- Audit Logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
UPDATE audit_logs SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- 8. Convert Single-Tenant Unique Constraints to Multi-Tenant Scoped Constraints

-- Clients: Phone unique per org
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_phone_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_org_phone ON clients(organization_id, phone);

-- Vehicles: Plate unique per org
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_plate_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_org_plate ON vehicles(organization_id, plate_number);

-- Parts: SKU unique per org
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_org_sku ON parts(organization_id, sku);

-- Invoices: Invoice Number unique per org
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_org_number ON invoices(organization_id, invoice_number);

-- 9. Create Performance Indexes for Multi-Tenant Scoping
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pvc_cards_org ON pvc_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_workers_org ON workers(organization_id);
CREATE INDEX IF NOT EXISTS idx_actions_org ON actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_parts_org ON parts(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_reminders_org ON reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);

-- 10. Enable PostgreSQL Row-Level Security (RLS) on all tenant tables

-- Helper function to check if current execution is scoped or platform admin
CREATE OR REPLACE FUNCTION current_app_org_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_org_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Clients RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_clients_org_isolation ON clients;
CREATE POLICY rls_clients_org_isolation ON clients
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Suppliers RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_suppliers_org_isolation ON suppliers;
CREATE POLICY rls_suppliers_org_isolation ON suppliers
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Vehicles RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_vehicles_org_isolation ON vehicles;
CREATE POLICY rls_vehicles_org_isolation ON vehicles
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- PVC Cards RLS
ALTER TABLE pvc_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_pvc_cards_org_isolation ON pvc_cards;
CREATE POLICY rls_pvc_cards_org_isolation ON pvc_cards
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Workers RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_workers_org_isolation ON workers;
CREATE POLICY rls_workers_org_isolation ON workers
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Actions RLS
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_actions_org_isolation ON actions;
CREATE POLICY rls_actions_org_isolation ON actions
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Parts RLS
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_parts_org_isolation ON parts;
CREATE POLICY rls_parts_org_isolation ON parts
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Stock Movements RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_stock_movements_org_isolation ON stock_movements;
CREATE POLICY rls_stock_movements_org_isolation ON stock_movements
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Invoices RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_invoices_org_isolation ON invoices;
CREATE POLICY rls_invoices_org_isolation ON invoices
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Appointments RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_appointments_org_isolation ON appointments;
CREATE POLICY rls_appointments_org_isolation ON appointments
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Reminders RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_reminders_org_isolation ON reminders;
CREATE POLICY rls_reminders_org_isolation ON reminders
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_audit_logs_org_isolation ON audit_logs;
CREATE POLICY rls_audit_logs_org_isolation ON audit_logs
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

-- Branches RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_branches_org_isolation ON branches;
CREATE POLICY rls_branches_org_isolation ON branches
  FOR ALL
  TO PUBLIC
  USING (
    organization_id = current_app_org_id()
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
