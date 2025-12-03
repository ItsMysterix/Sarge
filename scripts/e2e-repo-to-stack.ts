// E2E harness: connect repo → create project → create stack
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
  dotenv.config()
} catch {}
const { neon } = require('@neondatabase/serverless')

async function run() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')
  const sql: any = neon(dbUrl)
  const userId = 'user_1'

  const owner = process.env.E2E_OWNER || 'vercel'
  const repoName = process.env.E2E_REPO || 'next.js'
  const defaultBranch = process.env.E2E_BRANCH || 'main'

  const repo = await sql`
    INSERT INTO repositories (id, user_id, owner, repo, full_name, description, branch, is_primary)
    VALUES (gen_random_uuid()::text, ${userId}, ${owner}, ${repoName}, ${owner + '/' + repoName}, 'E2E repo', ${defaultBranch}, true)
    ON CONFLICT (user_id, owner, repo)
    DO UPDATE SET branch = EXCLUDED.branch, is_primary = true
    RETURNING *
  `

  const project = await sql`
    INSERT INTO projects (id, name, user_id, slug, repository_id, created_at)
    VALUES (gen_random_uuid(), 'E2E Project', ${userId}, 'e2e-project', ${repo[0].id}, now())
    ON CONFLICT (slug) DO UPDATE SET repository_id = EXCLUDED.repository_id
    RETURNING *
  `

  const stack = await sql`
    INSERT INTO stacks (id, name, description, status, services, environment, user_id)
    VALUES (
      gen_random_uuid()::text,
      'E2E Stack',
      'E2E stack from harness',
      'stopped',
      '[]'::jsonb,
      '{}'::jsonb,
      ${userId}
    )
    RETURNING *
  `

  console.log('E2E complete:', {
    repository: { id: repo[0].id, full_name: repo[0].full_name, branch: repo[0].branch },
    project: { id: project[0].id, slug: project[0].slug },
    stack: { id: stack[0].id, name: stack[0].name },
  })
}

run().catch((e: any) => { console.error('E2E failed:', e); process.exit(1) })
