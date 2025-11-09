-- Add workspace and deployment tracking to metrics table
ALTER TABLE metrics 
  ADD COLUMN IF NOT EXISTS workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS deployment_id BIGINT,
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS cpu_usage NUMERIC,
  ADD COLUMN IF NOT EXISTS memory_usage NUMERIC,
  ADD COLUMN IF NOT EXISTS latency_ms NUMERIC,
  ADD COLUMN IF NOT EXISTS cost_daily NUMERIC,
  ADD COLUMN IF NOT EXISTS uptime_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS project_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_workspace_id ON metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_deployment_id ON metrics(deployment_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_service_name ON metrics(service_name);

-- Create service_metrics table for detailed per-service tracking
CREATE TABLE IF NOT EXISTS service_metrics (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  deployment_id BIGINT,
  service_name TEXT NOT NULL,
  port INTEGER,
  status TEXT DEFAULT 'unknown', -- running, stopped, error
  cpu_percent NUMERIC,
  memory_mb NUMERIC,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_ms NUMERIC,
  uptime_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_metrics_workspace ON service_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_metrics_deployment ON service_metrics(deployment_id);
CREATE INDEX IF NOT EXISTS idx_service_metrics_service ON service_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_service_metrics_updated ON service_metrics(updated_at DESC);

-- Create workspace_health table for overall workspace health scores
CREATE TABLE IF NOT EXISTS workspace_health (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE,
  workspace_name TEXT,
  overall_grade TEXT DEFAULT 'N/A', -- A, B, C, D, F
  grade_score NUMERIC DEFAULT 0,
  avg_uptime NUMERIC DEFAULT 0,
  avg_response_ms NUMERIC DEFAULT 0,
  total_deployments INTEGER DEFAULT 0,
  successful_deployments INTEGER DEFAULT 0,
  failed_deployments INTEGER DEFAULT 0,
  active_services INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  daily_cost NUMERIC DEFAULT 0,
  last_deployment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_health_workspace ON workspace_health(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_health_grade ON workspace_health(grade_score DESC);

-- Comments
COMMENT ON TABLE service_metrics IS 'Real-time metrics for individual services running in deployments';
COMMENT ON TABLE workspace_health IS 'Aggregated health scores and metrics for workspaces';
COMMENT ON COLUMN metrics.workspace_id IS 'ID of the workspace this metric belongs to';
COMMENT ON COLUMN metrics.deployment_id IS 'ID of the deployment this metric is tracking';
COMMENT ON COLUMN metrics.service_name IS 'Name of the service being measured';
