import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { getDbPool } from "@/lib/db"
import { ensureCoreSchema } from "@/lib/db-schema"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured", details: "Set DATABASE_URL in your environment to enable repository features." },
        { status: 500 }
      )
    }

    try {
      const pool = getDbPool()
      await ensureCoreSchema(pool)
      const url = new URL(req.url)
      const projectSlug = url.searchParams.get('projectSlug')
      
      if (projectSlug) {
        // Prefer project-specific repository if set
        const byProject = await pool.query(
          `SELECT r.* FROM projects p
           JOIN repositories r ON r.id = p.repository_id
           WHERE p.slug = $1
           LIMIT 1`,
          [projectSlug]
        )
        if (byProject.rows.length > 0) {
          return NextResponse.json({ repository: byProject.rows[0] })
        }
      }

  // User's primary repository
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
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
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

    const { owner, repo, description, projectSlug } = await req.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: "Owner and repo are required" }, { status: 400 })
    }

    // Require real database
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured', details: 'Set DATABASE_URL in your environment to save repositories.' },
        { status: 500 }
      )
    }

    try {
      const pool = getDbPool()
      await ensureCoreSchema(pool)
      
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

      // Upsert repository (set as primary for the user)
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

      // If a projectSlug is provided, bind this repository to that project (one repo per project)
      if (projectSlug) {
        try {
          await pool.query(
            `UPDATE projects SET repository_id = $1, updated_at = NOW()
             WHERE slug = $2`,
            [result.rows[0].id, projectSlug]
          )
        } catch (projErr) {
          // Gracefully skip project binding if slug column doesn't exist yet
          console.warn('Could not bind repository to project:', projErr)
        }
      }

      return NextResponse.json({ repository: result.rows[0] })
    } catch (dbError) {
      console.error("Database error saving repository:", dbError)
      const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError)
      return NextResponse.json({ 
        error: 'Failed to save repository', 
        details: dbErrorMsg,
        hint: 'Check DATABASE_URL is set and user/repo tables exist'
      }, { status: 500 })
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
    // Ensure schema exists so DELETE doesn't fail on first-run
    try {
      await ensureCoreSchema(pool)
    } catch (e) {
      console.error("Schema ensure failed during delete:", e)
    }
    
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
