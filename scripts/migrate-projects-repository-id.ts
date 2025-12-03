// Migrate projects.repository_id from integer to text to match repositories.id (text/UUID)
// Loads env from .env.local/.env
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
  dotenv.config()
} catch {}
const { neon } = require('@neondatabase/serverless')

async function migrate() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')
  const sql: any = neon(dbUrl)

  // Check current type
  const columns = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'repository_id'
  `
  const currentType = columns[0]?.data_type || null
  if (currentType === 'text') {
    console.log('projects.repository_id already TEXT. No changes.')
    return
  }
  if (!currentType) {
    console.log('repository_id column missing, adding as TEXT...')
    await sql`ALTER TABLE projects ADD COLUMN repository_id TEXT;`
    console.log('Added repository_id TEXT.')
    return
  }

  console.log(`Migrating projects.repository_id from ${currentType} to TEXT...`)
  await sql`ALTER TABLE projects ALTER COLUMN repository_id TYPE TEXT USING repository_id::text;`
  console.log('Migration complete.')
}

migrate().catch((e: any) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
