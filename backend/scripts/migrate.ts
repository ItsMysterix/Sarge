import { Pool } from '@neondatabase/serverless'
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

async function ensureMigrationsTable(db: Pool) {
  await (db as any).query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
}

function listMigrations(dir: string): string[] {
  return readdirSync(dir)
    .filter(f => /\d+_.+\.sql$/.test(f))
    .sort((a, b) => a.localeCompare(b))
}

async function appliedSet(db: Pool): Promise<Set<string>> {
  const { rows } = await (db as any).query(`SELECT version FROM schema_migrations`)
  return new Set(rows.map((r: any) => r.version))
}

async function applyMigration(db: Pool, filePath: string, version: string) {
  const sql = readFileSync(filePath, 'utf8')
  await (db as any).query('BEGIN')
  try {
    await (db as any).query(sql)
    await (db as any).query('INSERT INTO schema_migrations(version) VALUES ($1)', [version])
    await (db as any).query('COMMIT')
    console.log(`Applied migration: ${version}`)
  } catch (e) {
    await (db as any).query('ROLLBACK')
    throw e
  }
}

export async function runMigrations(opts: { dryRun?: boolean } = {}) {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) throw new Error('DATABASE_URL required')
  const db = new Pool({ connectionString: DATABASE_URL })
  const dir = resolve(__dirname, '../../scripts/migrations')
  const files = listMigrations(dir)
  await ensureMigrationsTable(db as any)
  const done = await appliedSet(db as any)

  const pending = files.filter(f => !done.has(f))
  if (opts.dryRun) {
    console.log('Pending migrations:')
    for (const f of pending) console.log(` - ${f}`)
    return { pending }
  }

  for (const f of pending) {
    const p = join(dir, f)
    await applyMigration(db as any, p, f)
  }
  await (db as any).end?.()
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run')
  runMigrations({ dryRun })
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1) })
}
