import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const metrics = await sql`
      SELECT * FROM metrics 
      ORDER BY timestamp DESC 
      LIMIT 1
    `

    if (metrics.length === 0) {
      // Return mock data if no metrics found
      return NextResponse.json({
        id: "1",
        cpu: 68 + Math.floor(Math.random() * 20) - 10,
        memory: 83 + Math.floor(Math.random() * 10) - 5,
        latency: 45 + Math.floor(Math.random() * 20) - 10,
        cost: 91.4 + Math.random() * 10 - 5,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(metrics[0])
  } catch (error) {
    console.error("Failed to fetch metrics:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    return NextResponse.json({
      id: "1",
      cpu: 68 + Math.floor(Math.random() * 20) - 10,
      memory: 83 + Math.floor(Math.random() * 10) - 5,
      latency: 45 + Math.floor(Math.random() * 20) - 10,
      cost: 91.4 + Math.random() * 10 - 5,
      timestamp: new Date().toISOString(),
    })
  }
}
