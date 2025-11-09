export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export async function GET() {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email || "dev-mode"
    
    if (!sql) {
      // Mock data export
      const mockData = {
        settings: {
          user_id: userId,
          slack_alerts: true,
          auto_rebuild: false,
        },
        repositories: [],
        deployments: [],
        services: [],
        metrics: [],
        logs: [],
        exported_at: new Date().toISOString(),
      }
      
      return new NextResponse(JSON.stringify(mockData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="sarge-export-${Date.now()}.json"`,
        },
      })
    }

    // Fetch all user data
    const [settings, repositories, deployments, services, metrics, logs] = await Promise.all([
      sql`SELECT * FROM settings WHERE user_id = ${userId}`,
      sql`SELECT * FROM repositories WHERE user_id = (SELECT id FROM users WHERE email = ${userId})`,
      sql`SELECT * FROM deployments WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM services ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1000`,
      sql`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500`,
    ])

    const exportData = {
      settings: settings[0] || {},
      repositories: repositories || [],
      deployments: deployments || [],
      services: services || [],
      metrics: metrics || [],
      logs: logs || [],
      exported_at: new Date().toISOString(),
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sarge-export-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error("Failed to export data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
