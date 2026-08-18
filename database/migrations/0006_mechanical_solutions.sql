-- Migration 0006: Mechanical Solutions & Diagnostics Knowledge Base

CREATE TABLE IF NOT EXISTS mechanical_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  dtc_codes JSONB DEFAULT '[]'::jsonb,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  engine_code VARCHAR(100),
  years VARCHAR(100),
  symptoms TEXT NOT NULL,
  diagnostic_tool VARCHAR(100),
  root_cause TEXT NOT NULL,
  step_by_step_fix TEXT NOT NULL,
  parts_replaced TEXT,
  upvotes_count INTEGER DEFAULT 0 NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  is_verified_expert BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mechanical_solutions_org ON mechanical_solutions (organization_id);
CREATE INDEX IF NOT EXISTS idx_mechanical_solutions_make ON mechanical_solutions (make);
CREATE INDEX IF NOT EXISTS idx_mechanical_solutions_model ON mechanical_solutions (model);
CREATE INDEX IF NOT EXISTS idx_mechanical_solutions_upvotes ON mechanical_solutions (upvotes_count DESC);

ALTER TABLE mechanical_solutions ENABLE ROW LEVEL SECURITY;

-- Cross-Tenant Read: Any authenticated garage can read solutions
CREATE POLICY rls_mechanical_solutions_select ON mechanical_solutions
  FOR SELECT TO PUBLIC
  USING (true);

-- Single-Tenant Write: Only author garage can insert/update/delete
CREATE POLICY rls_mechanical_solutions_insert ON mechanical_solutions
  FOR INSERT TO PUBLIC
  WITH CHECK (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE POLICY rls_mechanical_solutions_update ON mechanical_solutions
  FOR UPDATE TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE POLICY rls_mechanical_solutions_delete ON mechanical_solutions
  FOR DELETE TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );

CREATE TABLE IF NOT EXISTS solution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES mechanical_solutions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (solution_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_solution_votes_solution ON solution_votes (solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_votes_org ON solution_votes (organization_id);

ALTER TABLE solution_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_solution_votes_select ON solution_votes
  FOR SELECT TO PUBLIC
  USING (true);

CREATE POLICY rls_solution_votes_write ON solution_votes
  FOR ALL TO PUBLIC
  USING (
    organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('app.is_platform_admin', true) = 'true'
  );
