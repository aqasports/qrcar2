-- Migration 0004: PVC Card Studio Designs and Fulfillment Orders

CREATE TABLE IF NOT EXISTS card_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  layout_preset VARCHAR(50) NOT NULL DEFAULT 'modern_slate',
  front_logo_url TEXT,
  front_headline VARCHAR(255),
  front_subheadline VARCHAR(255),
  front_bg_color VARCHAR(50) DEFAULT '#0f172a',
  front_accent_color VARCHAR(50) DEFAULT '#3b82f6',
  front_text_color VARCHAR(50) DEFAULT '#ffffff',
  back_bg_color VARCHAR(50) DEFAULT '#0f172a',
  back_text_color VARCHAR(50) DEFAULT '#ffffff',
  back_contact_phone VARCHAR(100),
  back_address TEXT,
  back_emergency_text VARCHAR(255),
  is_white_label BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_designs_org ON card_designs (organization_id);
CREATE INDEX IF NOT EXISTS idx_card_designs_status ON card_designs (status);

ALTER TABLE card_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_card_designs_isolation ON card_designs
  FOR ALL TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE TABLE IF NOT EXISTS card_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  card_design_id UUID NOT NULL REFERENCES card_designs(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 50),
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_wilaya VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled')),
  tracking_number VARCHAR(100),
  carrier_name VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_orders_org ON card_orders (organization_id);
CREATE INDEX IF NOT EXISTS idx_card_orders_status ON card_orders (status);

ALTER TABLE card_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_card_orders_isolation ON card_orders
  FOR ALL TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
