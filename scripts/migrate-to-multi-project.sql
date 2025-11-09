-- ============================================================================
-- MIGRATION: Single-Project to Multi-Project Architecture
-- ============================================================================
-- This migration transforms Sarge from single-project to multi-project
-- Allows users to manage multiple repositories/projects with isolated data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: CREATE NEW TABLES
-- ============================================================================

-- Projects table - Core entity for multi-project support
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- References users(id) from NextAuth (TEXT type)
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier
    description TEXT,
    framework VARCHAR(50), -- next.js, react, vue, node, python, etc
    repository_id INTEGER, -- References repositories(id), nullable for manual projects
    root_directory VARCHAR(255) DEFAULT './', -- For monorepo support
    
    -- Build settings (Vercel-like)
    build_command TEXT DEFAULT 'npm run build',
    output_directory TEXT DEFAULT '.next',
    install_command TEXT DEFAULT 'npm install',
    dev_command TEXT DEFAULT 'npm run dev',
    
    -- Deployment settings
    auto_deploy BOOLEAN DEFAULT true,
    auto_deploy_branch VARCHAR(255) DEFAULT 'main',
    preview_deployments BOOLEAN DEFAULT true,
    
    -- One-click deploy AI analysis results
    ai_detected_framework VARCHAR(50),
    ai_detected_ports JSONB DEFAULT '[]', -- [3000, 8080]
    ai_detected_tools JSONB DEFAULT '[]', -- ["node", "npm", "docker"]
    ai_analysis_summary TEXT,
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived', 'pending')),
    last_deployed_at TIMESTAMP WITH TIME ZONE,
    deployment_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, slug)
);

-- Project settings table - Advanced per-project configuration
CREATE TABLE IF NOT EXISTS project_settings (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Function settings (serverless)
    function_region VARCHAR(50) DEFAULT 'us-east-1',
    function_memory INTEGER DEFAULT 1024, -- MB
    function_timeout INTEGER DEFAULT 10, -- seconds
    function_runtime VARCHAR(50) DEFAULT 'nodejs18.x',
    
    -- Performance settings
    enable_edge BOOLEAN DEFAULT false,
    enable_analytics BOOLEAN DEFAULT true,
    enable_speed_insights BOOLEAN DEFAULT true,
    enable_caching BOOLEAN DEFAULT true,
    
    -- Security settings
    enable_waf BOOLEAN DEFAULT false,
    password_protection BOOLEAN DEFAULT false,
    password_hash TEXT,
    allowed_ips JSONB DEFAULT '[]',
    
    -- Advanced settings
    node_version VARCHAR(20) DEFAULT '18.x',
    custom_headers JSONB DEFAULT '[]',
    redirects JSONB DEFAULT '[]',
    rewrites JSONB DEFAULT '[]',
    environment_variables_encrypted BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);

-- Project domains table - Custom domain management
CREATE TABLE IF NOT EXISTS project_domains (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    dns_provider VARCHAR(50),
    ssl_enabled BOOLEAN DEFAULT true,
    ssl_certificate TEXT,
    ssl_expires_at TIMESTAMP WITH TIME ZONE,
    redirect_to VARCHAR(255), -- for www -> non-www redirects
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_domains_project_id ON project_domains(project_id);
CREATE INDEX idx_project_domains_domain ON project_domains(domain);

-- ============================================================================
-- STEP 2: ADD PROJECT_ID TO EXISTING TABLES
-- ============================================================================

-- Add project_id to environment_variables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='environment_variables' AND column_name='project_id') THEN
        ALTER TABLE environment_variables ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add project_id to deployments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='deployments' AND column_name='project_id') THEN
        ALTER TABLE deployments ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add project_id to logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='logs' AND column_name='project_id') THEN
        ALTER TABLE logs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add project_id to metrics
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='metrics' AND column_name='project_id') THEN
        ALTER TABLE metrics ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add project_id to services
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='services' AND column_name='project_id') THEN
        ALTER TABLE services ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add project_id to insights
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='insights' AND column_name='project_id') THEN
        ALTER TABLE insights ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_repository_id ON projects(repository_id);
CREATE INDEX IF NOT EXISTS idx_projects_framework ON projects(framework);

CREATE INDEX IF NOT EXISTS idx_environment_variables_project_id ON environment_variables(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_services_project_id ON services(project_id);
CREATE INDEX IF NOT EXISTS idx_insights_project_id ON insights(project_id);

-- ============================================================================
-- STEP 4: CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_settings_updated_at ON project_settings;
CREATE TRIGGER update_project_settings_updated_at 
    BEFORE UPDATE ON project_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_domains_updated_at ON project_domains;
CREATE TRIGGER update_project_domains_updated_at 
    BEFORE UPDATE ON project_domains 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: MIGRATE EXISTING DATA (OPTIONAL - Run if you have existing data)
-- ============================================================================

-- This section creates a default project for each user with existing data
-- Uncomment and run if migrating from existing single-project setup

/*
-- Create default project for each user with connected repositories
INSERT INTO projects (user_id, name, slug, description, repository_id, status, created_at)
SELECT DISTINCT
    r.user_id,
    COALESCE(r.repo, 'My Project') as name,
    LOWER(REGEXP_REPLACE(COALESCE(r.repo, 'my-project'), '[^a-zA-Z0-9]', '-', 'g')) as slug,
    'Default project created from migration' as description,
    r.id as repository_id,
    'active' as status,
    NOW() as created_at
FROM repositories r
WHERE r.is_primary = true
ON CONFLICT (user_id, slug) DO NOTHING;

-- Link existing deployments to projects
UPDATE deployments d
SET project_id = p.id
FROM projects p
WHERE p.repository_id = d.repository_id
AND d.project_id IS NULL;

-- Link existing logs to projects (use first project of user if no better match)
UPDATE logs l
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.user_id = l.user_id 
    ORDER BY p.created_at 
    LIMIT 1
)
WHERE l.project_id IS NULL
AND EXISTS (SELECT 1 FROM projects p WHERE p.user_id = l.user_id);

-- Link existing metrics to projects
UPDATE metrics m
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.user_id = m.user_id 
    ORDER BY p.created_at 
    LIMIT 1
)
WHERE m.project_id IS NULL
AND EXISTS (SELECT 1 FROM projects p WHERE p.user_id = m.user_id);

-- Link existing services to projects
UPDATE services s
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.user_id = s.user_id 
    ORDER BY p.created_at 
    LIMIT 1
)
WHERE s.project_id IS NULL
AND EXISTS (SELECT 1 FROM projects p WHERE p.user_id = s.user_id);

-- Create default project settings for all projects
INSERT INTO project_settings (project_id)
SELECT id FROM projects
WHERE NOT EXISTS (
    SELECT 1 FROM project_settings WHERE project_id = projects.id
);
*/

-- ============================================================================
-- STEP 6: ADD HELPFUL VIEWS
-- ============================================================================

-- View: Project stats for quick overview
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id as project_id,
    p.name,
    p.slug,
    p.status,
    COUNT(DISTINCT d.id) as total_deployments,
    COUNT(DISTINCT CASE WHEN d.status = 'success' THEN d.id END) as successful_deployments,
    COUNT(DISTINCT CASE WHEN d.status = 'failed' THEN d.id END) as failed_deployments,
    MAX(d.created_at) as last_deployment_at,
    COUNT(DISTINCT l.id) as total_logs,
    COUNT(DISTINCT CASE WHEN l.type = 'error' THEN l.id END) as error_count,
    COUNT(DISTINCT s.id) as active_services
FROM projects p
LEFT JOIN deployments d ON p.id = d.project_id
LEFT JOIN logs l ON p.id = l.project_id AND l.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN services s ON p.id = s.project_id AND s.status = 'running'
GROUP BY p.id, p.name, p.slug, p.status;

-- View: Recent project activity
CREATE OR REPLACE VIEW recent_project_activity AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    'deployment' as activity_type,
    d.id::text as activity_id,
    d.status as activity_status,
    d.summary as activity_description,
    d.created_at as activity_time
FROM projects p
JOIN deployments d ON p.id = d.project_id
WHERE d.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    p.id as project_id,
    p.name as project_name,
    'log' as activity_type,
    l.id::text as activity_id,
    l.type as activity_status,
    l.message as activity_description,
    l.timestamp as activity_time
FROM projects p
JOIN logs l ON p.id = l.project_id
WHERE l.timestamp > NOW() - INTERVAL '7 days' AND l.type IN ('error', 'alert')

ORDER BY activity_time DESC;

-- ============================================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE projects IS 'Core projects table - each project represents a deployed application';
COMMENT ON COLUMN projects.slug IS 'URL-friendly identifier used in routes like /projects/[slug]';
COMMENT ON COLUMN projects.ai_detected_framework IS 'Framework detected by AI during one-click deploy analysis';
COMMENT ON COLUMN projects.ai_detected_ports IS 'JSON array of ports the AI detected this project needs';
COMMENT ON COLUMN projects.ai_detected_tools IS 'JSON array of tools/dependencies detected by AI (node, npm, docker, etc)';

COMMENT ON TABLE project_settings IS 'Advanced per-project configuration settings';
COMMENT ON TABLE project_domains IS 'Custom domains linked to projects with SSL/verification status';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify migration success:

-- Check projects were created
-- SELECT COUNT(*) as project_count FROM projects;

-- Check project settings were created
-- SELECT COUNT(*) as settings_count FROM project_settings;

-- Verify deployments are linked to projects
-- SELECT COUNT(*) as linked_deployments FROM deployments WHERE project_id IS NOT NULL;

-- Check project stats view
-- SELECT * FROM project_stats LIMIT 5;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- WARNING: This will delete all projects and related data!
-- Uncomment ONLY if you need to rollback the migration

/*
DROP VIEW IF EXISTS recent_project_activity;
DROP VIEW IF EXISTS project_stats;

DROP TRIGGER IF EXISTS update_project_domains_updated_at ON project_domains;
DROP TRIGGER IF EXISTS update_project_settings_updated_at ON project_settings;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

ALTER TABLE environment_variables DROP COLUMN IF EXISTS project_id;
ALTER TABLE deployments DROP COLUMN IF EXISTS project_id;
ALTER TABLE logs DROP COLUMN IF EXISTS project_id;
ALTER TABLE metrics DROP COLUMN IF EXISTS project_id;
ALTER TABLE services DROP COLUMN IF EXISTS project_id;
ALTER TABLE insights DROP COLUMN IF EXISTS project_id;

DROP TABLE IF EXISTS project_domains CASCADE;
DROP TABLE IF EXISTS project_settings CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Update backend tRPC routers to use project_id
-- 2. Create ProjectContext provider in frontend
-- 3. Add project switcher to navbar
-- 4. Update all pages to filter by current project
-- 5. Build project settings pages
-- 6. Test multi-project workflows

SELECT 'Migration completed successfully!' as status;
