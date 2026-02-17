export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  const checks: Record<string, any> = {}
  try {
    // NextAuth configuration check
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET
    const githubId = process.env.GITHUB_ID
    const githubSecret = process.env.GITHUB_SECRET

    checks.nextauth = {
      url: nextAuthUrl || 'MISSING',
      secret: nextAuthSecret ? '✓ configured' : '✗ missing',
      callbackUrl: nextAuthUrl ? `${nextAuthUrl}/api/auth/callback/github` : 'INVALID',
    }

    checks.github_oauth = {
      clientId: githubId ? '✓ configured' : '✗ missing',
      clientSecret: githubSecret ? '✓ configured' : '✗ missing',
      expectedCallbackUrl: `${nextAuthUrl}/api/auth/callback/github`,
      status: githubId && githubSecret ? 'ready' : 'incomplete',
    }

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
    checks.github_token = { ok: !!process.env.GITHUB_TOKEN }

    // WS port check (static expectation)
    checks.ws = { expectedPort: 3200, url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3200' }

    const ok = Object.values(checks).every(v => v && v.ok !== false)
    return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error), checks }, { status: 500 })
  }
}
