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

-- Insert sample stacks
INSERT INTO stacks (name, description, status, services, environment, resource_usage) VALUES
('production-api', 'Main production API stack', 'running', 
  '[{"name": "api-server", "type": "container", "port": 3000}, {"name": "redis", "type": "container", "port": 6379}, {"name": "users-table", "type": "dynamodb"}]'::jsonb,
  '{"NODE_ENV": "production", "DATABASE_URL": "***", "REDIS_URL": "redis://localhost:6379"}'::jsonb,
  '{"cpu": 35.2, "memory": 512, "containers": 2}'::jsonb
),
('dev-fullstack', 'Development full-stack application', 'running',
  '[{"name": "frontend", "type": "container", "port": 3001}, {"name": "backend", "type": "container", "port": 4000}, {"name": "postgres", "type": "container", "port": 5432}]'::jsonb,
  '{"NODE_ENV": "development", "API_URL": "http://localhost:4000"}'::jsonb,
  '{"cpu": 28.7, "memory": 768, "containers": 3}'::jsonb
),
('data-pipeline', 'ETL data processing pipeline', 'running',
  '[{"name": "data-processor", "type": "lambda"}, {"name": "source-bucket", "type": "s3"}, {"name": "processed-bucket", "type": "s3"}, {"name": "events-queue", "type": "sqs"}]'::jsonb,
  '{"AWS_REGION": "us-east-1", "BATCH_SIZE": "100"}'::jsonb,
  '{"invocations": 1247, "s3_storage": "15.2gb"}'::jsonb
),
('microservices-demo', 'Demo microservices architecture', 'stopped',
  '[{"name": "auth-service", "type": "container", "port": 8001}, {"name": "user-service", "type": "container", "port": 8002}, {"name": "order-service", "type": "container", "port": 8003}, {"name": "api-gateway", "type": "container", "port": 8000}]'::jsonb,
  '{"SERVICE_MESH": "enabled", "TRACING": "jaeger"}'::jsonb,
  '{"cpu": 0, "memory": 0, "containers": 0}'::jsonb
),
('ml-inference', 'Machine learning inference stack', 'running',
  '[{"name": "model-api", "type": "lambda"}, {"name": "model-storage", "type": "s3"}, {"name": "predictions-table", "type": "dynamodb"}]'::jsonb,
  '{"MODEL_VERSION": "v2.1.0", "BATCH_INFERENCE": "true"}'::jsonb,
  '{"invocations": 8932, "avg_latency_ms": 127}'::jsonb
)
ON CONFLICT (name, user_id) DO NOTHING;

-- Insert sample stack services
INSERT INTO stack_services (stack_id, name, type, status, port, config) 
SELECT 
  s.id,
  'api-server',
  'container',
  'running',
  3000,
  '{"image": "node:18-alpine", "replicas": 2}'::jsonb
FROM stacks s WHERE s.name = 'production-api' LIMIT 1;

INSERT INTO stack_services (stack_id, name, type, status, port, config)
SELECT 
  s.id,
  'redis',
  'container',
  'running',
  6379,
  '{"image": "redis:7-alpine", "memory": "256mb"}'::jsonb
FROM stacks s WHERE s.name = 'production-api' LIMIT 1;

-- Insert sample deployments
INSERT INTO stack_deployments (stack_id, version, status, deployed_by, completed_at)
SELECT 
  s.id,
  'v1.2.3',
  'success',
  'admin',
  NOW() - INTERVAL '2 hours'
FROM stacks s WHERE s.name = 'production-api' LIMIT 1;

INSERT INTO stack_deployments (stack_id, version, status, deployed_by, completed_at)
SELECT 
  s.id,
  'v0.5.0',
  'success',
  'developer',
  NOW() - INTERVAL '1 day'
FROM stacks s WHERE s.name = 'dev-fullstack' LIMIT 1;
