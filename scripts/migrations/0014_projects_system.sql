-- Migration: Real Projects System
-- Creates tables for proper project management with workspace integration

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Workspace integration
    workspace_id TEXT,
    workspace_path TEXT,
    repository_url TEXT,
    
    -- Framework detection
    framework TEXT,
    detected_framework TEXT,
    detected_package_manager TEXT,
    detected_languages JSONB DEFAULT '[]'::jsonb,
    
    -- Build configuration
    root_directory TEXT DEFAULT './',
    build_command TEXT,
    output_directory TEXT,
    install_command TEXT,
    dev_command TEXT,
    start_command TEXT,
    
    -- Deployment settings
    auto_deploy BOOLEAN DEFAULT false,
    auto_deploy_branch TEXT DEFAULT 'main',
    preview_deployments BOOLEAN DEFAULT true,
    
    -- AI Analysis
    ai_detected_ports JSONB DEFAULT '[]'::jsonb,
    ai_detected_tools JSONB DEFAULT '[]'::jsonb,
    ai_analysis_summary TEXT,
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,
    
    -- Environment variables
    env_vars JSONB DEFAULT '{}'::jsonb,
    
    -- Status and metrics
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'paused', 'archived', 'pending')),
    last_deployed_at TIMESTAMP WITH TIME ZONE,
    deployment_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT projects_user_slug_unique UNIQUE (user_id, slug)
);

-- Project collaborators (for team access)
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    invited_by TEXT,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT project_collaborators_unique UNIQUE (project_id, user_id)
);

-- Project activity log
CREATE TABLE IF NOT EXISTS project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_created_at ON project_activity(created_at DESC);

-- Link deployments to projects
ALTER TABLE deployments 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
