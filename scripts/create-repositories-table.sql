-- Add repositories table to store connected GitHub repos
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, owner, repo)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_primary ON repositories(user_id, is_primary) WHERE is_primary = true;

-- Only one primary repo per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user ON repositories(user_id) WHERE is_primary = true;
