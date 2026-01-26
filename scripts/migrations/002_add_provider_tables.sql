-- Create providers_connections table to persist provider integrations per project
CREATE TABLE IF NOT EXISTS provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'containers', 'functions', 'static'
  credentials JSONB, -- OAuth token, API key, etc. (encrypted in production)
  status TEXT DEFAULT 'connected', -- 'connected', 'disconnected', 'error'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  connected_at TIMESTAMP,
  last_error TEXT,
  UNIQUE(project_id, provider_id)
);

-- Create environments table for project environments
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  name TEXT NOT NULL, -- 'development', 'staging', 'production', 'preview'
  provider_id TEXT NOT NULL,
  type TEXT DEFAULT 'manual', -- 'manual', 'preview', 'automatic'
  region TEXT, -- AWS region, Vercel region, etc.
  resource_config JSONB, -- CPU, memory, replicas, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, name, provider_id)
);

-- Create deployments_extended table with provider/env tracking
CREATE TABLE IF NOT EXISTS deployments_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL, -- which provider
  environment_id UUID REFERENCES environments(id),
  environment_name TEXT, -- 'preview', 'production', etc.
  git_ref TEXT, -- branch or tag
  git_commit TEXT,
  git_branch TEXT,
  preview_url TEXT, -- e.g., https://pr-123.vercel.app or https://app-preview.railway.app
  production_url TEXT, -- stable URL for production env
  deployment_type TEXT DEFAULT 'manual', -- 'manual', 'automatic', 'pr_preview'
  metadata JSONB, -- provider-specific info (CloudFormation stack ID, Vercel project ID, etc.)
  cost_estimate DECIMAL(10, 2), -- estimated monthly cost
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (deployment_id) REFERENCES deployments(id)
);

-- Create deployment_logs table with provider context
CREATE TABLE IF NOT EXISTS deployment_logs_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  environment_name TEXT,
  step TEXT, -- 'clone', 'install', 'build', 'deploy', 'health_check'
  type TEXT, -- 'info', 'warning', 'error', 'success'
  message TEXT,
  duration_ms INTEGER, -- how long this step took
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (deployment_id) REFERENCES deployments(id)
);

-- Create cost_estimates table
CREATE TABLE IF NOT EXISTS cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  environment_name TEXT,
  service_type TEXT, -- 'compute', 'database', 'storage', 'traffic'
  hourly_cost DECIMAL(10, 4),
  monthly_cost DECIMAL(10, 2), -- Estimated
  resource_info JSONB, -- CPU cores, memory GB, storage GB, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_provider_connections_project ON provider_connections(project_id);
CREATE INDEX idx_environments_project ON environments(project_id);
CREATE INDEX idx_deployments_extended_project ON deployments_extended(project_id);
CREATE INDEX idx_deployments_extended_provider ON deployments_extended(provider_id);
CREATE INDEX idx_deployment_logs_extended_deployment ON deployment_logs_extended(deployment_id);
CREATE INDEX idx_cost_estimates_project ON cost_estimates(project_id);
