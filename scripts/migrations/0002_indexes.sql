-- 0002_indexes.sql
-- Idempotent indexes for hot paths

-- Metrics latest query: ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp_desc ON metrics ("timestamp" DESC);

-- Logs recent query (optionally filtered by type) and ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_logs_timestamp_desc ON logs ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs (type);

-- Deployments listing/status: ORDER BY created_at DESC, filter by status
CREATE INDEX IF NOT EXISTS idx_deployments_created_at_desc ON deployments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments (status);
