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
      SELECT * FROM settings 
      WHERE user_id = ${userId}
      LIMIT 1
    `

    if (settings.length === 0) {
      // Return default settings if no settings found
      return NextResponse.json({
        id: "1",
        user_id: userId,
        slack_alerts: true,
        auto_rebuild: false,
        enable_animations: true,
        theme_mode: "dark",
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
    
    // Build dynamic update fields
    const updateFields = []
    const values: any[] = []
    
    if (updates.slack_alerts !== undefined) {
      updateFields.push('slack_alerts = $' + (values.length + 1))
      values.push(updates.slack_alerts)
    }
    if (updates.auto_rebuild !== undefined) {
      updateFields.push('auto_rebuild = $' + (values.length + 1))
      values.push(updates.auto_rebuild)
    }
    if (updates.enable_animations !== undefined) {
      updateFields.push('enable_animations = $' + (values.length + 1))
      values.push(updates.enable_animations)
    }
    if (updates.theme_mode !== undefined) {
      updateFields.push('theme_mode = $' + (values.length + 1))
      values.push(updates.theme_mode)
    }
    if (updates.notifications !== undefined) {
      updateFields.push('notifications = $' + (values.length + 1))
      values.push(JSON.stringify(updates.notifications))
    }
    
    values.push(userId)
    
    const settings = await sql`
      INSERT INTO settings (
        user_id, 
        slack_alerts, 
        auto_rebuild,
        enable_animations,
        theme_mode,
        notifications
      )
      VALUES (
        ${userId}, 
        ${updates.slack_alerts ?? true}, 
        ${updates.auto_rebuild ?? false},
        ${updates.enable_animations ?? true},
        ${updates.theme_mode ?? 'dark'},
        ${JSON.stringify(updates.notifications ?? {})}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        slack_alerts = COALESCE(EXCLUDED.slack_alerts, settings.slack_alerts),
        auto_rebuild = COALESCE(EXCLUDED.auto_rebuild, settings.auto_rebuild),
        enable_animations = COALESCE(EXCLUDED.enable_animations, settings.enable_animations),
        theme_mode = COALESCE(EXCLUDED.theme_mode, settings.theme_mode),
        notifications = COALESCE(EXCLUDED.notifications, settings.notifications)
      RETURNING *
    `

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
