export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function GET() {
  try {
    if (!sql) {
      console.error("DATABASE_URL not configured")
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const deployments = await sql`
      SELECT * FROM deployments 
      ORDER BY created_at DESC 
      LIMIT 20
    `

    return NextResponse.json(deployments)
  } catch (error) {
    console.error("Failed to fetch deployments:", error)
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 })
  }
}
