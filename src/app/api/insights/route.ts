export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const insights = await sql`
      SELECT * FROM insights 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (insights.length === 0) {
      return NextResponse.json({ error: "No insights available" }, { status: 404 })
    }

    return NextResponse.json(insights[0])
  } catch (error) {
    console.error("Failed to fetch insights:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
