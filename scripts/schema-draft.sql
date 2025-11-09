-- Draft schema derived from code scan (Neon/PostgreSQL)
-- Users table used in /api/user/profile and /api/repository
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repositories table referenced in /api/repository
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, owner, repo)
);

-- Settings table used in /api/settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  slack_alerts BOOLEAN DEFAULT true,
  auto_rebuild BOOLEAN DEFAULT false,
  enable_animations BOOLEAN DEFAULT true,
  theme_mode TEXT DEFAULT 'dark',
  notifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Deployments table used in /api/deploy and /api/deployments
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  commit TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','failed','running')),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logs table used in /api/logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('error','warn','info','debug')),
  message TEXT NOT NULL,
  service TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metrics table used in /api/metrics
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu DOUBLE PRECISION,
  memory DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services table used in /api/services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uptime logs used in /api/services/[id]/uptime
CREATE TABLE IF NOT EXISTS uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  value DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX(service_id,timestamp)
);

-- Insights table used in /api/insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  grade TEXT,
  tips JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additional recommended tables (projects) from mock /api/projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  framework TEXT,
  repository_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
  root_directory TEXT,
  build_command TEXT,
  output_directory TEXT,
  install_command TEXT,
  dev_command TEXT,
  auto_deploy BOOLEAN DEFAULT false,
  auto_deploy_branch TEXT,
  preview_deployments BOOLEAN DEFAULT false,
  ai_detected_framework TEXT,
  ai_detected_ports INT[],
  ai_detected_tools TEXT[],
  ai_analysis_summary TEXT,
  ai_analyzed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived','pending')),
  last_deployed_at TIMESTAMPTZ,
  deployment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
