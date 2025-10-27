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

    const services = await sql`
      SELECT * FROM services 
      ORDER BY name
    `

    return NextResponse.json(services)
  } catch (error) {
    console.error("Failed to fetch services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
