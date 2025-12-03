// Seed minimal data: user, repository, project, stack
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
  dotenv.config()
} catch {}
const { neon } = require('@neondatabase/serverless')

async function seed() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')
  const sql: any = neon(dbUrl)

  const userId = 'user_1'

  // Ensure user exists (id text)
  await sql`INSERT INTO users (id, email, name) VALUES (${userId}, 'user@example.com', 'Demo User') ON CONFLICT (id) DO NOTHING`

  // Repository
  const repo = await sql`
    INSERT INTO repositories (id, user_id, owner, repo, full_name, description, branch, is_primary)
    VALUES (gen_random_uuid()::text, ${userId}, 'vercel', 'next.js', 'vercel/next.js', 'Sample repo', 'main', true)
    ON CONFLICT (user_id, owner, repo)
    DO UPDATE SET is_primary = true
    RETURNING *
  `

  // Project
  const project = await sql`
    INSERT INTO projects (id, name, user_id, slug, repository_id, created_at)
    VALUES (gen_random_uuid(), 'Sample Project', ${userId}, 'sample-project', ${repo[0].id}, now())
    ON CONFLICT (slug) DO NOTHING
    RETURNING *
  `

  // Stack
  const stack = await sql`
    INSERT INTO stacks (id, name, description, status, services, environment, user_id)
    VALUES (
      gen_random_uuid()::text,
      'Sample Stack',
      'Stack from seed script',
      'stopped',
      '[]'::jsonb,
      '{}'::jsonb,
      ${userId}
    )
    RETURNING *
  `

  console.log('Seed complete:', {
    repository: repo[0],
    project: project[0] || 'existing',
    stack: stack[0],
  })
}

seed().catch((e: any) => { console.error('Seed failed:', e); process.exit(1) })
