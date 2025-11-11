export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    let logs
    if (type && type !== "all") {
      logs = await sql`
        SELECT * FROM logs 
        WHERE type = ${type}
        ORDER BY timestamp DESC 
        LIMIT 100
      `
    } else {
      logs = await sql`
        SELECT * FROM logs 
        ORDER BY timestamp DESC 
        LIMIT 100
      `
    }

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Failed to fetch logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const body = await request.json()
    const items: Array<{ type: string; message: string; service: string; timestamp?: string }>
      = Array.isArray(body) ? body : [body]

    // Basic validation
    const rows = items.map((l) => ({
      type: String(l.type || 'info'),
      message: String(l.message || ''),
      service: String(l.service || 'unknown'),
      timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
    }))

    // Bulk insert
    const values = rows.map((r) => `('${r.type}', '${r.message.replace(/'/g, "''")}', '${r.service.replace(/'/g, "''")}', '${r.timestamp}')`).join(',')
    await sql.raw?.(`INSERT INTO logs (type, message, service, timestamp) VALUES ${values}`)
      ?? await Promise.all(rows.map((r) => sql`
          INSERT INTO logs (type, message, service, timestamp)
          VALUES (${r.type}, ${r.message}, ${r.service}, ${r.timestamp})
        `))

    return NextResponse.json({ success: true, inserted: rows.length })
  } catch (error) {
    console.error('Failed to insert logs:', error)
    return NextResponse.json({ error: 'Failed to insert logs' }, { status: 500 })
  }
}
