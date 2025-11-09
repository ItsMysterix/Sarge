-- Add workspace tracking and services to deployments table
ALTER TABLE deployments 
  ADD COLUMN IF NOT EXISTS workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS workspace_name TEXT,
  ADD COLUMN IF NOT EXISTS workspace_path TEXT,
  ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for workspace lookups
CREATE INDEX IF NOT EXISTS idx_deployments_workspace_id ON deployments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);

-- Add comments
COMMENT ON COLUMN deployments.workspace_id IS 'ID of the workspace this deployment belongs to';
COMMENT ON COLUMN deployments.workspace_name IS 'Name of the workspace for quick display';
COMMENT ON COLUMN deployments.workspace_path IS 'Path to the workspace directory';
COMMENT ON COLUMN deployments.services IS 'JSON array of services with their ports and URLs';
COMMENT ON COLUMN deployments.updated_at IS 'Last update timestamp for deployment status changes';
