export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"

// Lazily and safely create a SQL client; require DB for real responses
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any
const DEV_USER_ID = "dev-mode"

export async function GET() {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email || DEV_USER_ID

    if (!sql) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const settings = await sql`
      SELECT * FROM user_settings 
      WHERE user_id = ${userId}
      LIMIT 1
    `

    if (settings.length === 0) {
      return NextResponse.json({
        user_id: userId,
        slack_alerts: true,
        auto_rebuild: false,
        enable_animations: true,
        theme_mode: "dark",
        default_region: "us-east-1",
        default_environment: "development",
        resources: { cpu: 0.5, memory: 512, replicas: 1 },
        notifications: {
          deploySuccess: true,
          deployFailure: true,
          serviceDown: true,
          highCpu: true,
          highMemory: false,
          securityAlerts: true,
          emailNotifications: false,
          slackNotifications: true,
        }
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const updates = await request.json()

  try {
    const session = await getServerSession()
    const userId = session?.user?.email || DEV_USER_ID

    if (!sql) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const settings = await sql`
      INSERT INTO user_settings (
        user_id, 
        slack_alerts, 
        auto_rebuild,
        enable_animations,
        theme_mode,
        notifications,
        default_region,
        default_environment,
        resources
      )
      VALUES (
        ${userId}, 
        ${updates.slack_alerts ?? true}, 
        ${updates.auto_rebuild ?? false},
        ${updates.enable_animations ?? true},
        ${updates.theme_mode ?? 'dark'},
        ${JSON.stringify(updates.notifications ?? {})},
        ${updates.default_region ?? 'us-east-1'},
        ${updates.default_environment ?? 'development'},
        ${JSON.stringify(updates.resources ?? {})}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        slack_alerts = COALESCE(EXCLUDED.slack_alerts, user_settings.slack_alerts),
        auto_rebuild = COALESCE(EXCLUDED.auto_rebuild, user_settings.auto_rebuild),
        enable_animations = COALESCE(EXCLUDED.enable_animations, user_settings.enable_animations),
        theme_mode = COALESCE(EXCLUDED.theme_mode, user_settings.theme_mode),
        notifications = COALESCE(EXCLUDED.notifications, user_settings.notifications),
        default_region = COALESCE(EXCLUDED.default_region, user_settings.default_region),
        default_environment = COALESCE(EXCLUDED.default_environment, user_settings.default_environment),
        resources = COALESCE(EXCLUDED.resources, user_settings.resources)
      RETURNING *
    `

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { action } = await request.json()
  if (action !== 'clear_data') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  try {
    const session = await getServerSession()
    const userId = session?.user?.email || DEV_USER_ID

    if (!sql) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    // Clear user data (metrics, logs, etc. - in a real app would be scoped to userId)
    await sql`DELETE FROM metrics`
    await sql`DELETE FROM system_logs`
    await sql`DELETE FROM audit_logs`

    return NextResponse.json({ success: true, message: 'All project data cleared successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 })
  }
}
