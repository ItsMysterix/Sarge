-- 0001_init.sql
-- Idempotent base tables

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  service_id TEXT,
  cpu NUMERIC,
  memory NUMERIC,
  latency NUMERIC,
  cost NUMERIC,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  service_id TEXT,
  type TEXT,
  message TEXT,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deployments table (named 'deployments' to match code)
CREATE TABLE IF NOT EXISTS deployments (
  id BIGSERIAL PRIMARY KEY,
  branch TEXT NOT NULL,
  commit TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
