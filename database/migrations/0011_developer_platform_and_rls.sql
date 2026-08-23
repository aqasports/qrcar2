-- ==============================================================================
-- Migration 0011: Developer Platform, Outbound Webhooks, and RLS Hardening
-- ==============================================================================

-- 1. DEVELOPER ACCOUNTS
CREATE TABLE IF NOT EXISTS developer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_name VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  website_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_account_user ON developer_accounts(user_id);

-- 2. APPS (Integrations & Store Catalog)
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_account_id UUID REFERENCES developer_accounts(id) ON DELETE CASCADE NOT NULL,
  owner_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'published', 'suspended')),
  rejection_reason TEXT,
  redirect_uris JSONB DEFAULT '[]'::jsonb NOT NULL,
  webhook_callback_url TEXT,
  requested_scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_apps_developer ON apps(developer_account_id);
CREATE INDEX IF NOT EXISTS idx_apps_owner_org ON apps(owner_organization_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);
CREATE INDEX IF NOT EXISTS idx_apps_visibility ON apps(visibility);

-- 3. APP INSTALLS (Tenant App Installations)
CREATE TABLE IF NOT EXISTS app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  granted_scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
  installed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'uninstalled', 'suspended')),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  uninstalled_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_install_unique ON app_installs(app_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_org ON app_installs(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_app ON app_installs(app_id);

-- 4. API KEYS (Hashed Developer Credentials)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_install_id UUID REFERENCES app_installs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Default API Key',
  key_prefix VARCHAR(20) NOT NULL,
  hashed_secret VARCHAR(255) NOT NULL,
  scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_install ON api_keys(app_install_id);

-- 5. WEBHOOK SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_install_id UUID REFERENCES app_installs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  topic VARCHAR(100) NOT NULL,
  target_url TEXT NOT NULL,
  signing_secret VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_org ON webhook_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subs_topic ON webhook_subscriptions(topic);
CREATE INDEX IF NOT EXISTS idx_webhook_subs_install ON webhook_subscriptions(app_install_id);

-- 6. WEBHOOK DELIVERIES (Outbound Event Log)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  event_id UUID NOT NULL,
  topic VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'exhausted')),
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  response_status INT,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_sub ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_id);

-- 7. API REQUEST LOG (Durable Rate Limiting)
CREATE TABLE IF NOT EXISTS api_request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status_code INT,
  duration_ms INT,
  window_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_log_key_bucket ON api_request_log(api_key_id, window_bucket);
CREATE INDEX IF NOT EXISTS idx_api_log_org ON api_request_log(organization_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE app_installs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_app_installs_isolation ON app_installs;
CREATE POLICY rls_app_installs_isolation ON app_installs
  USING (
    organization_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_api_keys_isolation ON api_keys;
CREATE POLICY rls_api_keys_isolation ON api_keys
  USING (
    organization_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_webhook_subs_isolation ON webhook_subscriptions;
CREATE POLICY rls_webhook_subs_isolation ON webhook_subscriptions
  USING (
    organization_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_webhook_deliveries_isolation ON webhook_deliveries;
CREATE POLICY rls_webhook_deliveries_isolation ON webhook_deliveries
  USING (
    organization_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_api_request_log_isolation ON api_request_log;
CREATE POLICY rls_api_request_log_isolation ON api_request_log
  USING (
    organization_id::text = current_setting('app.current_org_id', true)
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
