-- Complete PostgreSQL schema for Sarge (Offline Vercel)
-- Run this to set up all required tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255), -- for email/password auth
    email_verified BOOLEAN DEFAULT false,
    image TEXT, -- profile avatar URL
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification tokens (for email verification)
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ============================================================================
-- PROJECT & REPOSITORY TABLES
-- ============================================================================

-- Repositories table (connected GitHub repos)
CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner VARCHAR(255) NOT NULL,
    repo VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    branch VARCHAR(255) DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, owner, repo)
);

-- Environment variables (per project/user)
CREATE TABLE IF NOT EXISTS environment_variables (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    environment VARCHAR(50) DEFAULT 'development' CHECK (environment IN ('development', 'preview', 'production')),
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DEPLOYMENT TABLES
-- ============================================================================

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    repository_id INTEGER REFERENCES repositories(id) ON DELETE SET NULL,
    branch VARCHAR(255) NOT NULL,
    commit VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed', 'cancelled')),
    summary TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    author VARCHAR(255) DEFAULT 'system',
    environment VARCHAR(50) DEFAULT 'production',
    build_logs TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MONITORING & OBSERVABILITY TABLES
-- ============================================================================

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warn', 'error', 'alert', 'debug')),
    message TEXT NOT NULL,
    service VARCHAR(255) NOT NULL DEFAULT 'system',
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    deployment_id INTEGER REFERENCES deployments(id) ON DELETE CASCADE,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    cpu_usage FLOAT NOT NULL CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
    memory_usage FLOAT NOT NULL CHECK (memory_usage >= 0 AND memory_usage <= 100),
    disk_usage FLOAT DEFAULT 0,
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    request_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SERVICES & INFRASTRUCTURE TABLES
-- ============================================================================

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'up' CHECK (status IN ('up', 'down', 'degraded', 'maintenance')),
    service_type VARCHAR(50) DEFAULT 'api' CHECK (service_type IN ('api', 'database', 'worker', 'cache', 'storage', 'function')),
    port INTEGER,
    url TEXT,
    health_check_url TEXT,
    repository_id INTEGER REFERENCES repositories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service uptime logs
CREATE TABLE IF NOT EXISTS uptime_logs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    uptime_value DECIMAL(5,2) NOT NULL CHECK (uptime_value >= 0 AND uptime_value <= 100),
    response_time_ms INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AWS EMULATION TABLES
-- ============================================================================

-- AWS Resources (S3, DynamoDB, Lambda, etc.)
CREATE TABLE IF NOT EXISTS aws_resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('s3', 'dynamodb', 'lambda', 'sqs', 'sns', 'eventbridge')),
    resource_name VARCHAR(255) NOT NULL,
    resource_arn VARCHAR(512),
    configuration JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STACKS & COMPOSED SERVICES
-- ============================================================================

-- Stacks table (compose multiple services)
CREATE TABLE IF NOT EXISTS stacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    services JSONB NOT NULL, -- array of service configurations
    status VARCHAR(50) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS & PREFERENCES TABLES
-- ============================================================================

-- User settings
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme_mode VARCHAR(20) DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'system')),
    enable_animations BOOLEAN DEFAULT true,
    default_region VARCHAR(50) DEFAULT 'us-east-1',
    default_environment VARCHAR(50) DEFAULT 'development',
    notifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations (webhooks, APIs, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('webhook', 'slack', 'github', 'docker')),
    name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_preview VARCHAR(20) NOT NULL, -- first 8 chars for display
    scopes JSONB, -- permissions array
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INSIGHTS & ANALYTICS
-- ============================================================================

-- Insights table (AI recommendations)
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'good' CHECK (status IN ('excellent', 'good', 'warning', 'critical')),
    grade CHAR(1) NOT NULL DEFAULT 'A' CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
    tip TEXT NOT NULL,
    confidence_score INTEGER DEFAULT 85 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    category VARCHAR(50) DEFAULT 'performance' CHECK (category IN ('performance', 'security', 'cost', 'reliability')),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users and authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Repositories
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_primary ON repositories(user_id, is_primary) WHERE is_primary = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user ON repositories(user_id) WHERE is_primary = true;

-- Environment variables
CREATE INDEX IF NOT EXISTS idx_env_vars_user_id ON environment_variables(user_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_repo_id ON environment_variables(repository_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_environment ON environment_variables(environment);

-- Deployments
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_repo_id ON deployments(repository_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);

-- Logs and metrics
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);

-- Services and uptime
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_uptime_logs_service_timestamp ON uptime_logs(service_id, timestamp DESC);

-- AWS resources
CREATE INDEX IF NOT EXISTS idx_aws_resources_user_id ON aws_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_resources_type ON aws_resources(resource_type);

-- Stacks
CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_stacks_status ON stacks(status);

-- Settings and integrations
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Insights
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_date ON insights(date DESC);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- HELPFUL COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON TABLE repositories IS 'Connected GitHub repositories per user';
COMMENT ON TABLE environment_variables IS 'Environment variables per project and environment';
COMMENT ON TABLE deployments IS 'Deployment history and status';
COMMENT ON TABLE services IS 'Running services and their health status';
COMMENT ON TABLE aws_resources IS 'Emulated AWS resources (S3, DynamoDB, Lambda, etc.)';
COMMENT ON TABLE stacks IS 'Composed multi-service applications';
COMMENT ON TABLE settings IS 'User preferences and configuration';
COMMENT ON TABLE integrations IS 'External service integrations (Slack, webhooks, etc.)';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE insights IS 'AI-generated recommendations and insights';
