-- Migration 0007: Professional Directory & Tier-Boosted SEO Profiles

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '["diagnostic", "mecanique"]'::jsonb,
  ADD COLUMN IF NOT EXISTS brands_serviced JSONB DEFAULT '["Toutes Marques"]'::jsonb,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"mon":"08:00 - 18:00","tue":"08:00 - 18:00","wed":"08:00 - 18:00","thu":"08:00 - 18:00","fri":"Fermé","sat":"08:00 - 17:00","sun":"08:00 - 18:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS wilaya VARCHAR(100) DEFAULT '16 - Alger',
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Alger',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Route Nationale, Alger',
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '0550 00 00 00',
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS gps_lat NUMERIC(10, 7) DEFAULT 36.7538,
  ADD COLUMN IF NOT EXISTS gps_lng NUMERIC(10, 7) DEFAULT 3.0588,
  ADD COLUMN IF NOT EXISTS is_verified_pro BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_directory_listed BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_organizations_wilaya ON organizations (wilaya);
CREATE INDEX IF NOT EXISTS idx_organizations_directory_listed ON organizations (is_directory_listed);
