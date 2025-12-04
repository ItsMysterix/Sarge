-- Create stacks table
CREATE TABLE IF NOT EXISTS stacks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'deploying', 'error')),
  services JSONB DEFAULT '[]'::jsonb,
  environment JSONB DEFAULT '{}'::jsonb,
  resource_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT,
  CONSTRAINT stacks_name_unique UNIQUE (name, user_id)
);

-- Create stack_services table for individual services within a stack
CREATE TABLE IF NOT EXISTS stack_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stack_id TEXT NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'lambda', 's3', 'dynamodb', 'api', 'container', etc.
  status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'error')),
  port INTEGER,
  config JSONB DEFAULT '{}'::jsonb,
  health_check_url TEXT,
  last_health_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stack_deployments table for deployment history
CREATE TABLE IF NOT EXISTS stack_deployments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stack_id TEXT NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  changes JSONB DEFAULT '[]'::jsonb,
  deployed_by TEXT,
  deployed_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_stacks_status ON stacks(status);
CREATE INDEX IF NOT EXISTS idx_stack_services_stack_id ON stack_services(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_deployments_stack_id ON stack_deployments(stack_id);

