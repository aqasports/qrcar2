-- Migration 0012: Customizable Repair Order Templates, Line Items & Torque Specifications Engine

-- 1. Repair Order Templates (Per-Garage Customizable Templates)
CREATE TABLE IF NOT EXISTS repair_order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'maintenance', -- 'maintenance', 'repair', 'inspection', 'custom'
  description TEXT,
  default_labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  default_labor_hours NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  checkpoints JSONB DEFAULT '[]',
  suggested_parts JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ro_templates_org ON repair_order_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ro_templates_category ON repair_order_templates(organization_id, category);

-- 2. Template Line Items (Custom acts, services, and parts inside a template)
CREATE TABLE IF NOT EXISTS template_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES repair_order_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL DEFAULT 'service', -- 'service', 'part', 'labor', 'inspection'
  default_unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  default_quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(50) NOT NULL DEFAULT 'u', -- 'u', 'h', 'L', 'set', 'forfait'
  linked_part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_template_line_items_tmpl ON template_line_items(template_id);

-- 3. Repair Order Items (Actual custom acts and parts attached to an action)
CREATE TABLE IF NOT EXISTS repair_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL DEFAULT 'service', -- 'service', 'part', 'labor', 'inspection'
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- in-order custom editable price
  unit VARCHAR(50) NOT NULL DEFAULT 'u',
  linked_part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  unit_price_snapshot NUMERIC(10, 2), -- snapshot of catalog sale price if linked to a part
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ro_items_action ON repair_order_items(action_id);

-- 4. Alter Actions table to support tax toggling and custom tax rate
ALTER TABLE actions ADD COLUMN IF NOT EXISTS has_tax BOOLEAN DEFAULT true;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 19.00;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES repair_order_templates(id) ON DELETE SET NULL;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS quality_checkpoints JSONB DEFAULT '[]';

-- 5. Torque Specifications Reference Table (Couples de Serrage)
CREATE TABLE IF NOT EXISTS torque_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'wheel_fastener', 'cylinder_head', 'spark_plug', 'standard_bolt', 'oil_drain', 'brake_caliper', 'suspension'
  make VARCHAR(100), -- NULL = universal
  model VARCHAR(100),
  engine_code VARCHAR(50),
  year_from INTEGER,
  year_to INTEGER,
  component VARCHAR(255) NOT NULL,
  torque_nm NUMERIC(8, 2) NOT NULL,
  torque_sequence TEXT, -- "Stage 1: 30 Nm | Stage 2: 90° | Stage 3: 90°"
  thread_spec VARCHAR(50), -- "M12 x 1.5", "M14 x 1.25"
  bolt_grade VARCHAR(20), -- "8.8", "10.9", "12.9"
  notes TEXT,
  source VARCHAR(100) DEFAULT 'oem_database'
);

CREATE INDEX IF NOT EXISTS idx_torque_specs_cat ON torque_specs(category);
CREATE INDEX IF NOT EXISTS idx_torque_specs_make_model ON torque_specs(make, model);
CREATE INDEX IF NOT EXISTS idx_torque_specs_engine ON torque_specs(engine_code);

-- 6. Row Level Security (RLS) for tenant isolation
ALTER TABLE repair_order_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_order_items ENABLE ROW LEVEL SECURITY;
