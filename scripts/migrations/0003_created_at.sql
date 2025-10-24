-- Optional hardening: add created_at alongside existing reserved "timestamp" columns
-- Keeps READ paths stable (still ORDER BY "timestamp"), but provides a standard column for future use.

-- Metrics: add created_at, backfill from timestamp, add index
ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Backfill existing rows
UPDATE metrics SET created_at = COALESCE(created_at, "timestamp");

-- Set a default for new rows
ALTER TABLE metrics
  ALTER COLUMN created_at SET DEFAULT NOW();

-- Helpful index for future queries ordering by created_at
CREATE INDEX IF NOT EXISTS idx_metrics_created_at_desc ON metrics (created_at DESC);


-- Logs: add created_at, backfill from timestamp, add index
ALTER TABLE logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Backfill existing rows
UPDATE logs SET created_at = COALESCE(created_at, "timestamp");

-- Set a default for new rows
ALTER TABLE logs
  ALTER COLUMN created_at SET DEFAULT NOW();

-- Helpful index for future queries ordering by created_at
CREATE INDEX IF NOT EXISTS idx_logs_created_at_desc ON logs (created_at DESC);
