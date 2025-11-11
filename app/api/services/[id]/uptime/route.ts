export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const serviceId = params.id

    if (!sql) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    const uptime = await sql`
      SELECT * FROM uptime_logs 
      WHERE service_id = ${serviceId}
      ORDER BY timestamp DESC 
      LIMIT 24
    `

    if (uptime.length === 0) {
      return NextResponse.json([])
    }

    return NextResponse.json(uptime)
  } catch (error) {
    console.error("Failed to fetch uptime:", error)

    return NextResponse.json({ error: 'Failed to fetch uptime' }, { status: 500 })
  }
}
