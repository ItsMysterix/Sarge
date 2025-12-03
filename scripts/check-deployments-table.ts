// Check deployments table schema
try { var dotenv = require('dotenv'); dotenv.config() } catch {}
const neon = require('@neondatabase/serverless').neon;
const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name='deployments' 
      ORDER BY ordinal_position
    `;
    
    if (cols.length === 0) {
      console.log('❌ deployments table does not exist');
      console.log('\nCreating deployments table...');
      
      await sql`
        CREATE TABLE IF NOT EXISTS deployments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id TEXT,
          workspace_name TEXT,
          workspace_path TEXT,
          branch TEXT NOT NULL,
          commit TEXT,
          status TEXT NOT NULL,
          summary TEXT,
          services JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      console.log('✅ deployments table created');
    } else {
      console.log('✅ deployments table exists with columns:');
      console.table(cols);
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

checkSchema();
