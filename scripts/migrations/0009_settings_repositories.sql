-- 0009_settings_repositories.sql
-- Settings and Repositories tables to support /api/settings and /api/repository

-- repositories references users(id) which is TEXT in 0008_auth_tables.sql
CREATE TABLE IF NOT EXISTS repositories (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, owner, repo)
);

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_user_primary ON repositories(user_id, is_primary);

-- settings stores user_id as email string per /api/settings/route.ts
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  slack_alerts BOOLEAN DEFAULT true,
  auto_rebuild BOOLEAN DEFAULT false,
  enable_animations BOOLEAN DEFAULT true,
  theme_mode TEXT DEFAULT 'dark',
  notifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
