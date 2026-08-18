-- Migration 0010: Multi-Channel Notifications Engine (Email, SMS, WhatsApp Queue)

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
  recipient VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_org ON notification_queue (organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue (status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue (channel);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue (created_at DESC);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_notification_queue_isolation ON notification_queue
  FOR ALL TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
