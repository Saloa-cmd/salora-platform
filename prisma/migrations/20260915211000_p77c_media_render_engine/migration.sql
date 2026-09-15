-- P77-C: governed SALORA media render lifecycle.
CREATE TYPE media_render_state AS ENUM ('DRAFT','QUEUED','RENDERING','REVIEW','APPROVED','REJECTED','FAILED','FINAL_RENDERED');
CREATE TYPE creative_review_decision AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE media_render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  state media_render_state NOT NULL DEFAULT 'DRAFT',
  composition_id varchar(120) NOT NULL DEFAULT 'SaloraProductPreview',
  format varchar(24) NOT NULL,
  storyboard jsonb NOT NULL,
  input_props jsonb NOT NULL,
  output_url text,
  output_sha256 varchar(64),
  duration_seconds numeric(6,2) NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  error_message text,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state NOT IN ('APPROVED','FINAL_RENDERED')) OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX media_render_jobs_product_created_idx ON media_render_jobs(product_id, created_at DESC);
CREATE INDEX media_render_jobs_state_created_idx ON media_render_jobs(state, created_at DESC);

CREATE TABLE creative_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  render_job_id uuid NOT NULL REFERENCES media_render_jobs(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision creative_review_decision NOT NULL DEFAULT 'PENDING',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX creative_reviews_job_created_idx ON creative_reviews(render_job_id, created_at DESC);

CREATE TABLE media_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  render_job_id uuid REFERENCES media_render_jobs(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  from_state media_render_state,
  to_state media_render_state,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_audit_events_job_created_idx ON media_audit_events(render_job_id, created_at DESC);

ALTER TABLE media_render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_audit_events ENABLE ROW LEVEL SECURITY;

-- Application access remains through authenticated server-side transactions with SALORA RLS context.
CREATE POLICY media_render_jobs_admin_manager ON media_render_jobs FOR ALL TO authenticated
USING ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER'])
WITH CHECK ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER']);
CREATE POLICY creative_reviews_admin_manager ON creative_reviews FOR ALL TO authenticated
USING ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER'])
WITH CHECK ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER']);
CREATE POLICY media_audit_events_read_admin_manager ON media_audit_events FOR SELECT TO authenticated
USING ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER']);
CREATE POLICY media_audit_events_insert_admin_manager ON media_audit_events FOR INSERT TO authenticated
WITH CHECK ((auth.jwt()->'app_metadata'->'roles') ?| ARRAY['ADMIN','MANAGER']);