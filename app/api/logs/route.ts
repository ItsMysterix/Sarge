import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

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

    if (logs.length === 0) {
      // Return mock data if no logs found
      const mockLogs = [
        {
          id: "1",
          type: "error",
          message: "Authentication failed for user ID 12345",
          service: "api-gateway",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          type: "warn",
          message: "High memory usage detected: 85% of allocated memory in use",
          service: "worker-queue",
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
      ]

      return NextResponse.json(type && type !== "all" ? mockLogs.filter((log) => log.type === type) : mockLogs)
    }

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Failed to fetch logs:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    const mockLogs = [
      {
        id: "1",
        type: "error",
        message: "Authentication failed for user ID 12345",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        type: "warn",
        message: "High memory usage detected: 85% of allocated memory in use",
        service: "worker-queue",
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ]

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    return NextResponse.json(type && type !== "all" ? mockLogs.filter((log) => log.type === type) : mockLogs)
  }
}
