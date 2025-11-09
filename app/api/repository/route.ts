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

    try {
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
    } catch (dbError) {
      console.error("Database error fetching repository:", dbError)
      console.log("⚠️ Database unavailable, returning null repository")
      return NextResponse.json({ repository: null })
    }
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

    try {
      const pool = getDbPool()
      
      // Get user ID
      const userResult = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [session.user.email]
      )

      if (userResult.rows.length === 0) {
        // Create user if doesn't exist
        const newUserResult = await pool.query(
          `INSERT INTO users (email, name, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [session.user.email, session.user.name || session.user.email]
        )
        const userId = newUserResult.rows[0].id

        // Create repository
        const result = await pool.query(
          `INSERT INTO repositories (user_id, owner, repo, full_name, description, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
           ON CONFLICT (user_id, owner, repo)
           DO UPDATE SET
             description = EXCLUDED.description,
             is_primary = true,
             updated_at = NOW()
           RETURNING *`,
          [userId, owner, repo, `${owner}/${repo}`, description || '']
        )

        return NextResponse.json({ repository: result.rows[0] })
      }

      const userId = userResult.rows[0].id

      // Upsert repository (set as primary)
      const result = await pool.query(
        `INSERT INTO repositories (user_id, owner, repo, full_name, description, is_primary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT (user_id, owner, repo)
         DO UPDATE SET
           description = EXCLUDED.description,
           is_primary = true,
           updated_at = NOW()
         RETURNING *`,
        [userId, owner, repo, `${owner}/${repo}`, description || '']
      )

      // Unset other repos as primary
      await pool.query(
        `UPDATE repositories SET is_primary = false
         WHERE user_id = $1 AND id != $2`,
        [userId, result.rows[0].id]
      )

      return NextResponse.json({ repository: result.rows[0] })
    } catch (dbError) {
      console.error("Database error saving repository:", dbError)
      
      // Return success with in-memory data if DB fails (development fallback)
      const fallbackRepo = {
        id: Date.now(),
        user_id: session.user.email,
        owner,
        repo,
        full_name: `${owner}/${repo}`,
        description: description || '',
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      console.log("⚠️ Using fallback repository storage (DB unavailable)")
      return NextResponse.json({ repository: fallbackRepo })
    }
  } catch (error) {
    console.error("Error saving repository:", error)
    return NextResponse.json(
      { error: "Failed to save repository", details: error instanceof Error ? error.message : String(error) },
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
