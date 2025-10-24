-- 0005_deploy_status_guard.sql
-- Add status constraint and supplemental columns for deployments, idempotently

ALTER TABLE deployments
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error TEXT;

DO $$ BEGIN
  ALTER TABLE deployments
    ADD CONSTRAINT deployments_status_chk
    CHECK (status IN ('pending','running','success','failed'));
EXCEPTION WHEN duplicate_object THEN
  -- constraint already exists
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_deployments_status_created_at
  ON deployments (status, created_at DESC);
