-- Remove workspace-related columns and tables since workspaces are no longer managed by the app
-- Users work with local directories directly; AI analyzes from GitHub without cloning

-- Drop workspace-specific tables
DROP TABLE IF EXISTS workspace_health CASCADE;
DROP TABLE IF EXISTS service_metrics CASCADE;

-- Remove workspace columns from metrics table
ALTER TABLE metrics DROP COLUMN IF EXISTS workspace_id CASCADE;

-- Remove workspace columns from deployments table if present
ALTER TABLE deployments DROP COLUMN IF EXISTS workspace_id CASCADE;
ALTER TABLE deployments DROP COLUMN IF EXISTS workspace_name CASCADE;
ALTER TABLE deployments DROP COLUMN IF EXISTS workspace_path CASCADE;

-- Remove workspace columns from projects table if present
ALTER TABLE projects DROP COLUMN IF EXISTS workspace_id CASCADE;
ALTER TABLE projects DROP COLUMN IF EXISTS workspace_path CASCADE;

-- Clean up any indexes that reference workspace columns
DROP INDEX IF EXISTS idx_metrics_workspace_id;
DROP INDEX IF EXISTS idx_service_metrics_workspace;
DROP INDEX IF EXISTS idx_workspace_health_workspace;
DROP INDEX IF EXISTS idx_workspace_health_grade;
