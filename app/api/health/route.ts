export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  const checks: Record<string, any> = {}
  try {
    // DB check
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      checks.db = { ok: false, error: 'DATABASE_URL missing' }
    } else {
      const sql: any = neon(dbUrl)
      try {
        const res = await sql`SELECT 1 as ok`
        checks.db = { ok: res?.[0]?.ok === 1 }
      } catch (e: any) {
        checks.db = { ok: false, error: e?.message || String(e) }
      }
    }

    // GitHub token check
    checks.github = { ok: !!process.env.GITHUB_TOKEN }

    // WS port check (static expectation)
    checks.ws = { expectedPort: 3200 }

    const ok = Object.values(checks).every(v => v && v.ok !== false)
    return NextResponse.json({ ok, checks })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error), checks }, { status: 500 })
  }
}
