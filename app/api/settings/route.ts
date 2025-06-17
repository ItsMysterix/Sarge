import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const DEV_USER_ID = "dev-mode"

export async function GET() {
  try {
    const settings = await sql`
      SELECT * FROM settings 
      WHERE user_id = ${DEV_USER_ID}
      LIMIT 1
    `

    if (settings.length === 0) {
      // Return mock data if no settings found
      return NextResponse.json({
        id: "1",
        user_id: DEV_USER_ID,
        slack_alerts: true,
        auto_rebuild: false,
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to fetch settings:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    return NextResponse.json({
      id: "1",
      user_id: DEV_USER_ID,
      slack_alerts: true,
      auto_rebuild: false,
    })
  }
}

export async function PATCH(request: Request) {
  const updates = await request.json() // Declare the updates variable here

  try {
    const settings = await sql`
      INSERT INTO settings (user_id, slack_alerts, auto_rebuild)
      VALUES (${DEV_USER_ID}, ${updates.slack_alerts || false}, ${updates.auto_rebuild || false})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        slack_alerts = EXCLUDED.slack_alerts,
        auto_rebuild = EXCLUDED.auto_rebuild
      RETURNING *
    `

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to update settings:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    return NextResponse.json({
      id: "1",
      user_id: DEV_USER_ID,
      slack_alerts: updates.slack_alerts || false,
      auto_rebuild: updates.auto_rebuild || false,
    })
  }
}
