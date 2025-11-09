#!/usr/bin/env node
/**
 * Create missing tables for Sarge
 */

const { neon } = require('@neondatabase/serverless');

async function createTables() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🚀 Creating Missing Tables\n');

  const sql = neon(databaseUrl);

  // Create repositories table
  console.log('📄 Creating repositories table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS repositories (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          owner VARCHAR(255) NOT NULL,
          repo VARCHAR(255) NOT NULL,
          full_name VARCHAR(512) NOT NULL,
          description TEXT,
          is_primary BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, owner, repo)
      )
    `;
    console.log('✅ repositories table created\n');
  } catch (error) {
    console.log('⚠️  repositories table already exists or error:', error.message, '\n');
  }

  // Create indexes
  console.log('📄 Creating indexes...');
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_repositories_primary ON repositories(user_id, is_primary) WHERE is_primary = true`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user ON repositories(user_id) WHERE is_primary = true`;
    console.log('✅ Indexes created\n');
  } catch (error) {
    console.log('⚠️  Index error:', error.message, '\n');
  }

  // Create project_repositories junction table
  console.log('📄 Creating project_repositories table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS project_repositories (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id, repository_id)
      )
    `;
    console.log('✅ project_repositories table created\n');
  } catch (error) {
    console.log('⚠️  project_repositories table already exists or error:', error.message, '\n');
  }

  // Verify tables
  console.log('📋 Verifying tables...');
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('repositories', 'project_repositories')
    ORDER BY table_name
  `;
  
  console.log('✅ Tables verified:');
  tables.forEach(t => console.log(`   - ${t.table_name}`));

  console.log('\n🎉 Setup complete!\n');
}

createTables().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
