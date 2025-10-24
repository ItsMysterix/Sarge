-- 0006_deployment_logs.sql
-- Structured per-deploy logs table (idempotent)

-- Create table if not exists (using DO block to be compatible with older Postgres lacking IF NOT EXISTS on constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'deployment_logs'
  ) THEN
    CREATE TABLE deployment_logs (
      id BIGSERIAL PRIMARY KEY,
      deployment_id BIGINT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
      ts TIMESTAMPTZ NOT NULL DEFAULT now(),
      step TEXT,
      line TEXT NOT NULL
    );
  END IF;
END$$;

-- Helpful index for retrieval and pagination
CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment_id_id ON deployment_logs (deployment_id, id);
