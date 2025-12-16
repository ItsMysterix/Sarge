export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const url = process.env.DATABASE_URL
    if (!url) {
      return NextResponse.json({ ok: false, message: 'DATABASE_URL not set' }, { status: 500 })
    }

    const sql = neon(url)
    // Lightweight check: fetch current timestamp
    await sql`SELECT NOW()`

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[db/health] failed', err)
    return NextResponse.json({ ok: false, message: err?.message || 'Database check failed' }, { status: 500 })
  }
}
