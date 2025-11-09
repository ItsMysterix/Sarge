import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getDbPool } from "@/lib/db"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    const pool = getDbPool()

    // Get current password hash
    const result = await pool.query(
      `SELECT c.password_hash 
       FROM users u
       LEFT JOIN user_credentials c ON u.id = c.user_id
       WHERE u.email = $1`,
      [session.user.email]
    )

    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      return NextResponse.json(
        { error: "This account uses OAuth authentication and cannot change password" },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    await pool.query(
      `UPDATE user_credentials 
       SET password_hash = $1, updated_at = NOW()
       FROM users
       WHERE user_credentials.user_id = users.id 
       AND users.email = $2`,
      [newPasswordHash, session.user.email]
    )

    return NextResponse.json({ 
      success: true,
      message: "Password changed successfully" 
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    )
  }
}
