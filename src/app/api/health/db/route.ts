export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Tables we expect based on code & migrations
const REQUIRED_TABLES = [
  'metrics',
  'logs',
  'deployments',
  'deployment_logs',
  'rate_limit_hits',
  'users',
  'accounts',
  'sessions',
  'verification_tokens',
  'repositories',
  'settings',
  'services',
  'uptime_logs',
  'insights',
  'projects'
]

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL
  if (!hasDbUrl) {
    return NextResponse.json({
      status: 'degraded',
      reason: 'DATABASE_URL missing',
      tables: {},
    })
  }

  const sql = neon(process.env.DATABASE_URL as string)
  const tableStatus: Record<string, boolean> = {}
  try {
    for (const t of REQUIRED_TABLES) {
      const [{ exists }] = await sql`SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${t}
      ) as exists`
      tableStatus[t] = !!exists
    }

    const missing = Object.entries(tableStatus).filter(([, ok]) => !ok).map(([n]) => n)
    return NextResponse.json({
      status: missing.length === 0 ? 'ok' : 'partial',
      missing,
      tables: tableStatus,
    })
  } catch (e) {
    console.error('DB health check failed', e)
    return NextResponse.json({ status: 'error', error: (e as Error).message })
  }
}
