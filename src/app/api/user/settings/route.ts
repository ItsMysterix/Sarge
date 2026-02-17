export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { neon } from "@neondatabase/serverless"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        if (!sql) {
            // Fallback for no DB connection
            return NextResponse.json({
                deployment_emails: true,
                product_emails: false
            })
        }

        // First get the user ID from the email
        // Assuming users table has email. 
        // If not found, we can't get settings.
        const validUser = await sql`SELECT id FROM users WHERE email = ${session.user.email} LIMIT 1`

        if (validUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userId = validUser[0].id

        const settings = await sql`
      SELECT deployment_emails, product_emails
      FROM user_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `

        if (settings.length === 0) {
            // Create default settings
            const newSettings = await sql`
        INSERT INTO user_settings (user_id, deployment_emails, product_emails)
        VALUES (${userId}, true, false)
        RETURNING deployment_emails, product_emails
      `
            return NextResponse.json(newSettings[0])
        }

        return NextResponse.json(settings[0])
    } catch (error) {
        console.error("Failed to fetch user settings:", error)
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const updates = await request.json()
        const { deployment_emails, product_emails } = updates

        if (!sql) {
            return NextResponse.json({ success: true, mock: true })
        }

        const validUser = await sql`SELECT id FROM users WHERE email = ${session.user.email} LIMIT 1`

        if (validUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userId = validUser[0].id

        // Upsert settings
        const settings = await sql`
      INSERT INTO user_settings (user_id, deployment_emails, product_emails, updated_at)
      VALUES (${userId}, ${deployment_emails}, ${product_emails}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        deployment_emails = EXCLUDED.deployment_emails, 
        product_emails = EXCLUDED.product_emails,
        updated_at = CURRENT_TIMESTAMP
      RETURNING deployment_emails, product_emails
    `

        return NextResponse.json(settings[0])
    } catch (error) {
        console.error("Failed to update user settings:", error)
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        )
    }
}
