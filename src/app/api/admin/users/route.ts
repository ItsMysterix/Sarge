import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getDbPool } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated (basic protection)
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = getDbPool()

    // Get all users with their account info
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.email_verified,
        u.image,
        u.created_at,
        COUNT(DISTINCT a.id) as oauth_accounts,
        EXISTS(SELECT 1 FROM user_credentials WHERE user_id = u.id) as has_password
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)

    // Get session count
    const sessionsResult = await pool.query(`
      SELECT user_id, COUNT(*) as session_count
      FROM sessions
      WHERE expires > NOW()
      GROUP BY user_id
    `)

    const sessionMap = new Map(
      sessionsResult.rows.map(row => [row.user_id, row.session_count])
    )

    const users = usersResult.rows.map(user => ({
      ...user,
      active_sessions: sessionMap.get(user.id) || 0,
    }))

    // Get stats
    const stats = {
      total_users: users.length,
      verified_users: users.filter(u => u.email_verified).length,
      unverified_users: users.filter(u => !u.email_verified).length,
      users_with_password: users.filter(u => u.has_password).length,
      users_with_oauth: users.filter(u => u.oauth_accounts > 0).length,
    }

    return NextResponse.json({ users, stats })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const pool = getDbPool()
    await pool.query("DELETE FROM users WHERE id = $1", [userId])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
