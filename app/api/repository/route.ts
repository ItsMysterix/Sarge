import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { getDbPool } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = getDbPool()
    
    // Get user's primary repository
    const result = await pool.query(
      `SELECT r.* FROM repositories r
       JOIN users u ON r.user_id = u.id
       WHERE u.email = $1 AND r.is_primary = true
       LIMIT 1`,
      [session.user.email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ repository: null })
    }

    return NextResponse.json({ repository: result.rows[0] })
  } catch (error) {
    console.error("Error fetching repository:", error)
    return NextResponse.json({ repository: null })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { owner, repo, description } = await req.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: "Owner and repo are required" }, { status: 400 })
    }

    const pool = getDbPool()
    
    // Get user ID
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Upsert repository (set as primary)
    const result = await pool.query(
      `INSERT INTO repositories (user_id, owner, repo, full_name, description, is_primary)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (user_id, owner, repo)
       DO UPDATE SET
         description = EXCLUDED.description,
         is_primary = true,
         updated_at = NOW()
       RETURNING *`,
      [userId, owner, repo, `${owner}/${repo}`, description]
    )

    // Unset other repos as primary
    await pool.query(
      `UPDATE repositories SET is_primary = false
       WHERE user_id = $1 AND id != $2`,
      [userId, result.rows[0].id]
    )

    return NextResponse.json({ repository: result.rows[0] })
  } catch (error) {
    console.error("Error saving repository:", error)
    return NextResponse.json(
      { error: "Failed to save repository" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = getDbPool()
    
    // Delete user's primary repository
    await pool.query(
      `DELETE FROM repositories r
       USING users u
       WHERE r.user_id = u.id AND u.email = $1 AND r.is_primary = true`,
      [session.user.email]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting repository:", error)
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    )
  }
}
