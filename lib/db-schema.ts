import type { Pool } from "@neondatabase/serverless"

// Ensure the minimum set of columns needed by repository connect exist.
// Safe to run on every request; only adds missing columns to existing tables.
export async function ensureCoreSchema(pool: Pool) {
  // Users table - should already exist from NextAuth
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Repositories table - add missing columns if needed
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

  // Add missing columns to repositories if they don't exist
  await pool.query(`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;`)
  await pool.query(`ALTER TABLE repositories ADD COLUMN IF NOT EXISTS branch VARCHAR(255) DEFAULT 'main';`)

  // Projects table - add repository_id column if missing (multi-project migration)
  // Don't try to create the table since it exists in production
  try {
    // Ensure repository_id column exists
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS repository_id TEXT;`)
    // If repository_id is integer in existing DBs, migrate to TEXT to match repositories.id (TEXT/UUID)
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'projects' AND column_name = 'repository_id' AND data_type = 'integer'
        ) THEN
          ALTER TABLE projects ALTER COLUMN repository_id TYPE TEXT USING repository_id::text;
        END IF;
      END $$;
    `)
    // Do NOT add FK automatically due to type variations across environments
    // Add FK if types match (both TEXT) and constraint doesn't exist
    await pool.query(`
      DO $$
      DECLARE
        proj_type TEXT;
        repo_type TEXT;
      BEGIN
        SELECT data_type INTO proj_type FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'repository_id';

        SELECT data_type INTO repo_type FROM information_schema.columns
        WHERE table_name = 'repositories' AND column_name = 'id';

        IF proj_type = 'text' AND repo_type = 'text' THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'projects_repository_id_fkey'
          ) THEN
            ALTER TABLE projects ADD CONSTRAINT projects_repository_id_fkey
            FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE SET NULL;
          END IF;
        END IF;
      END $$;
    `)
  } catch (e) {
    // Projects table might not exist in some setups; that's ok
    console.warn('[schema] Could not ensure repository_id TEXT on projects:', e)
  }

  // Add slug column to projects if missing
  try {
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(255);`)
  } catch (e) {
    console.warn('[schema] Could not add slug to projects:', e)
  }

  // Helpful indexes
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_repositories_primary ON repositories(user_id, is_primary) WHERE is_primary = true;`)
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_repository_id ON projects(repository_id);`)
  } catch (e) {
    // Projects table might not exist; ignore
  }
}
