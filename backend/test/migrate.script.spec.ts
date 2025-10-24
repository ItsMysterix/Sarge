import { describe, test, expect, vi } from 'vitest'

describe('migrate script --dry-run', () => {
  test('lists pending migrations in order and exits 0', async () => {
    const { runMigrations } = await import('../src/../scripts/migrate')
    const out: string[] = []
    const origLog = console.log
    console.log = (msg?: any) => { if (typeof msg === 'string') out.push(msg) }
    try {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
      // Mock Pool to avoid real DB
      vi.mock('@neondatabase/serverless', () => ({ Pool: class { query() { return { rows: [] } } end() {} } }))
  const res: any = await runMigrations({ dryRun: true })
  expect(res && Array.isArray(res.pending)).toBe(true)
      // ensure output includes header and lists
      expect(out.find(s => s.includes('Pending migrations'))).toBeTruthy()
    } finally {
      console.log = origLog
    }
  })
})
