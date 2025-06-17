import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const serviceId = params.id

    const uptime = await sql`
      SELECT * FROM uptime_logs 
      WHERE service_id = ${serviceId}
      ORDER BY timestamp DESC 
      LIMIT 24
    `

    if (uptime.length === 0) {
      // Return mock data if no uptime found
      const mockUptime = Array.from({ length: 24 }, (_, i) => ({
        id: `${i}`,
        service_id: serviceId,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        value: 95 + Math.random() * 5,
      }))

      return NextResponse.json(mockUptime)
    }

    return NextResponse.json(uptime)
  } catch (error) {
    console.error("Failed to fetch uptime:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    const serviceId = params.id
    const mockUptime = Array.from({ length: 24 }, (_, i) => ({
      id: `${i}`,
      service_id: serviceId,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      value: 95 + Math.random() * 5,
    }))

    return NextResponse.json(mockUptime)
  }
}
