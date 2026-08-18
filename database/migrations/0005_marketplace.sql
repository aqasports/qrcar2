-- Migration 0005: Cross-Tenant Parts Marketplace & Inquiries

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  oem_number VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (condition IN ('new_oem', 'new_aftermarket', 'used_tested', 'refurbished')),
  compatibility_makes TEXT,
  compatibility_models TEXT,
  compatibility_years VARCHAR(100),
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  location_wilaya VARCHAR(100) NOT NULL,
  description TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_org ON marketplace_listings (organization_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings (status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_oem ON marketplace_listings (oem_number);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings (category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_wilaya ON marketplace_listings (location_wilaya);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Cross-Tenant Read: Any tenant can read active listings, but single-tenant write
CREATE POLICY rls_marketplace_listings_select ON marketplace_listings
  FOR SELECT TO PUBLIC
  USING (
    status = 'active'
    OR organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE POLICY rls_marketplace_listings_insert ON marketplace_listings
  FOR INSERT TO PUBLIC
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE POLICY rls_marketplace_listings_update ON marketplace_listings
  FOR UPDATE TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE POLICY rls_marketplace_listings_delete ON marketplace_listings
  FOR DELETE TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE TABLE IF NOT EXISTS marketplace_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seller_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  proposed_price NUMERIC(10, 2),
  buyer_phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_listing ON marketplace_inquiries (listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_buyer ON marketplace_inquiries (buyer_organization_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_seller ON marketplace_inquiries (seller_organization_id);

ALTER TABLE marketplace_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_marketplace_inquiries_isolation ON marketplace_inquiries
  FOR ALL TO PUBLIC
  USING (
    buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR seller_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
