-- Migration 0008: Direct Mechanic-to-Mechanic Messaging & Inter-Garage Chat

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  org_b_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context_type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (context_type IN ('general', 'marketplace_listing', 'mechanical_solution')),
  context_id UUID,
  context_title VARCHAR(255),
  last_message_text TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_org_a ON conversations (org_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_b ON conversations (org_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations (last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_conversations_isolation ON conversations
  FOR ALL TO PUBLIC
  USING (
    org_a_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR org_b_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  dtc_attachment VARCHAR(50),
  part_ref_attachment VARCHAR(100),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_org ON direct_messages (sender_org_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages (created_at ASC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_direct_messages_isolation ON direct_messages
  FOR ALL TO PUBLIC
  USING (
    sender_org_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = direct_messages.conversation_id
      AND (
        c.org_a_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
        OR c.org_b_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
      )
    )
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
