-- 0011_projects_insights.sql
-- Creates minimal projects and insights tables to back existing endpoints and health checks.

-- Enable UUID generation if available (safe no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  framework TEXT,
  repository_id BIGINT,
  status TEXT NOT NULL DEFAULT 'active',
  last_deployed_at TIMESTAMPTZ,
  deployment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

-- Insights table (global; latest record is used by /api/insights)
CREATE TABLE IF NOT EXISTS insights (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  grade TEXT NOT NULL,
  tips JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insights_created_at_idx ON insights(created_at DESC);
