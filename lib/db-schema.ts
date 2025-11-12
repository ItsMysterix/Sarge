import type { Pool } from "@neondatabase/serverless"

// Ensure the minimum set of tables used by repository connect exist.
// Safe to run on every request; uses IF NOT EXISTS and minimal indexes.
export async function ensureCoreSchema(pool: Pool) {
  // Users table (basic fields used by /api/repository route)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Repositories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner VARCHAR(255) NOT NULL,
      repo VARCHAR(255) NOT NULL,
      full_name VARCHAR(512) NOT NULL,
      description TEXT,
      is_primary BOOLEAN DEFAULT false,
      branch VARCHAR(255) DEFAULT 'main',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, owner, repo)
    );
  `)

  // Projects table (slimmed version compatible with migrate-to-multi-project.sql)
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id TEXT,
      name VARCHAR(255),
      slug VARCHAR(255) NOT NULL,
      description TEXT,
      framework VARCHAR(50),
      repository_id INTEGER REFERENCES repositories(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(slug)
    );
  `)

  // Helpful indexes
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_repositories_primary ON repositories(user_id, is_primary) WHERE is_primary = true;`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_repository_id ON projects(repository_id);`)
}
