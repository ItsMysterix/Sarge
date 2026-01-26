-- Migration: Add comprehensive Qovery-like features
-- Includes: Secrets management, audit logs, cost tracking, traffic management, health checks

-- ============= SECRETS MANAGEMENT =============
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  environment_id VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value_encrypted TEXT NOT NULL, -- AES-256 encrypted
  version INTEGER NOT NULL DEFAULT 1,
  created_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(255),
  UNIQUE (project_id, environment_id, key, version)
);

CREATE INDEX IF NOT EXISTS idx_secrets_lookup ON secrets(project_id, environment_id, key, deleted_at);
CREATE INDEX IF NOT EXISTS idx_secrets_version ON secrets(project_id, environment_id, key, version DESC);

-- ============= AUDIT LOGS =============
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL, -- 'secret.accessed', 'deploy.created', 'environment.deleted', etc.
  resource_type VARCHAR(100) NOT NULL, -- 'secret', 'deployment', 'environment', etc.
  resource_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ============= PROVIDER CREDENTIALS =============
CREATE TABLE IF NOT EXISTS provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(100) NOT NULL, -- 'vercel', 'railway', etc.
  user_id VARCHAR(255), -- NULL for org-wide credentials
  credentials_encrypted TEXT NOT NULL, -- JSON encrypted with AES-256
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_creds_lookup ON provider_credentials(provider_id, user_id);

-- ============= COST TRACKING =============
CREATE TABLE IF NOT EXISTS cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  environment_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(100) NOT NULL,
  deployment_id VARCHAR(255),
  hourly_rate NUMERIC(10, 4) DEFAULT 0,
  monthly_estimate NUMERIC(10, 2) DEFAULT 0,
  breakdown JSONB DEFAULT '{}', -- { "compute": 10.5, "storage": 2.3, "traffic": 1.2 }
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_estimates_project ON cost_estimates(project_id, environment_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_provider ON cost_estimates(provider_id, start_date DESC);

-- ============= TRAFFIC MANAGEMENT =============
CREATE TABLE IF NOT EXISTS traffic_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  environment_id VARCHAR(255) NOT NULL,
  strategy VARCHAR(50) NOT NULL, -- 'blue-green', 'canary', 'rolling'
  active_deployment_id VARCHAR(255),
  previous_deployment_id VARCHAR(255),
  canary_weight INTEGER DEFAULT 0, -- 0-100 percentage for canary strategy
  rollout_status VARCHAR(50) DEFAULT 'stable', -- 'stable', 'rolling-out', 'rolling-back'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, environment_id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_configs_lookup ON traffic_configs(project_id, environment_id);

-- ============= HEALTH CHECKS =============
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id VARCHAR(255) NOT NULL,
  deployment_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'http', 'tcp', 'grpc', 'command'
  path VARCHAR(500), -- For HTTP checks: /health, /ready
  port INTEGER,
  interval_seconds INTEGER DEFAULT 30,
  timeout_seconds INTEGER DEFAULT 10,
  healthy_threshold INTEGER DEFAULT 2, -- Consecutive successes to mark healthy
  unhealthy_threshold INTEGER DEFAULT 3, -- Consecutive failures to mark unhealthy
  restart_policy VARCHAR(50) DEFAULT 'on-failure', -- 'always', 'on-failure', 'never'
  max_restarts INTEGER DEFAULT 3,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_id, deployment_id);

-- ============= HEALTH CHECK RESULTS =============
CREATE TABLE IF NOT EXISTS health_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id UUID NOT NULL REFERENCES health_checks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'healthy', 'unhealthy', 'unknown'
  response_time_ms INTEGER,
  status_code INTEGER, -- For HTTP checks
  error_message TEXT,
  checked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_check_results_lookup ON health_check_results(health_check_id, checked_at DESC);

-- ============= DEPLOYMENT ROLLBACKS =============
CREATE TABLE IF NOT EXISTS deployment_rollbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id VARCHAR(255) NOT NULL,
  previous_deployment_id VARCHAR(255) NOT NULL,
  reason TEXT,
  triggered_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'failed'
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_rollbacks_lookup ON deployment_rollbacks(deployment_id, created_at DESC);

-- ============= USER ROLES & PERMISSIONS =============
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'developer', 'viewer'
  project_id VARCHAR(255), -- NULL = org-wide role
  environment_id VARCHAR(255), -- NULL = all environments in project
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id, environment_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, project_id, environment_id);

-- ============= PR PREVIEW ENVIRONMENTS =============
CREATE TABLE IF NOT EXISTS pr_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(100) NOT NULL,
  pr_number INTEGER NOT NULL,
  pr_title TEXT,
  pr_author VARCHAR(255),
  branch VARCHAR(255) NOT NULL,
  commit_sha VARCHAR(255),
  deployment_id VARCHAR(255),
  preview_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'building', 'ready', 'failed', 'closed'
  auto_cleanup BOOLEAN DEFAULT true, -- Auto-destroy when PR is closed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  UNIQUE (project_id, pr_number)
);

CREATE INDEX IF NOT EXISTS idx_pr_previews_lookup ON pr_previews(project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_previews_provider ON pr_previews(provider_id, status);

-- ============= DATABASE INSTANCES (Managed Databases) =============
CREATE TABLE IF NOT EXISTS database_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  environment_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(100) NOT NULL,
  database_type VARCHAR(50) NOT NULL, -- 'postgres', 'mysql', 'mongodb', 'redis'
  instance_name VARCHAR(255) NOT NULL,
  connection_string_encrypted TEXT, -- Encrypted connection string
  version VARCHAR(50),
  storage_gb INTEGER,
  backup_enabled BOOLEAN DEFAULT true,
  last_backup_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'provisioning', -- 'provisioning', 'active', 'backing-up', 'restoring', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_database_instances_lookup ON database_instances(project_id, environment_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_database_instances_provider ON database_instances(provider_id, status);

-- ============= DATABASE BACKUPS =============
CREATE TABLE IF NOT EXISTS database_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_instance_id UUID NOT NULL REFERENCES database_instances(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'pre-deploy'
  size_mb NUMERIC(10, 2),
  storage_location TEXT,
  status VARCHAR(50) DEFAULT 'in-progress', -- 'in-progress', 'completed', 'failed'
  error_message TEXT,
  triggered_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_database_backups_lookup ON database_backups(database_instance_id, created_at DESC);

-- ============= Comments =============
COMMENT ON TABLE secrets IS 'Versioned secrets per environment with encryption at rest';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all sensitive operations';
COMMENT ON TABLE provider_credentials IS 'Encrypted provider credentials (Vercel, Railway, AWS, etc.)';
COMMENT ON TABLE cost_estimates IS 'Cost tracking per deployment and environment';
COMMENT ON TABLE traffic_configs IS 'Traffic management for blue/green, canary deployments';
COMMENT ON TABLE health_checks IS 'Health check configurations per service';
COMMENT ON TABLE health_check_results IS 'Historical health check results';
COMMENT ON TABLE deployment_rollbacks IS 'Deployment rollback history';
COMMENT ON TABLE user_roles IS 'RBAC for project and environment access';
COMMENT ON TABLE pr_previews IS 'Preview environments for GitHub pull requests';
COMMENT ON TABLE database_instances IS 'Managed database instances lifecycle';
COMMENT ON TABLE database_backups IS 'Database backup history and restore points';
