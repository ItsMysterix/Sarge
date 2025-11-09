import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * DEV ONLY: Test endpoint to connect repository without authentication
 * REMOVE IN PRODUCTION!
 */
export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const { email, owner, repo, projectSlug } = await req.json()

    if (!email || !owner || !repo) {
      return NextResponse.json(
        { error: "email, owner, and repo are required" },
        { status: 400 }
      )
    }

    const pool = getDbPool()

    // Create or get user
    const userResult = await pool.query(
      `INSERT INTO users (email, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [email, email.split('@')[0]]
    )
    const userId = userResult.rows[0].id

    // Create or update repository
    const repoResult = await pool.query(
      `INSERT INTO repositories (user_id, owner, repo, full_name, description, is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       ON CONFLICT (user_id, owner, repo)
       DO UPDATE SET
         description = EXCLUDED.description,
         is_primary = true,
         updated_at = NOW()
       RETURNING *`,
      [userId, owner, repo, `${owner}/${repo}`, 'Test repository']
    )
    const repoId = repoResult.rows[0].id

    // Unset other repos as primary
    await pool.query(
      `UPDATE repositories SET is_primary = false
       WHERE user_id = $1 AND id != $2`,
      [userId, repoId]
    )

    // If projectSlug provided, bind repo to project
    if (projectSlug) {
      await pool.query(
        `INSERT INTO projects (user_id, name, slug, repository_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, slug)
         DO UPDATE SET
           repository_id = EXCLUDED.repository_id,
           updated_at = NOW()`,
        [userId, projectSlug, projectSlug, repoId]
      )
    }

    // Fetch GitHub data
    const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
    const ghData = ghResponse.ok ? await ghResponse.json() : null

    return NextResponse.json({
      success: true,
      repository: repoResult.rows[0],
      github: ghData ? {
        stars: ghData.stargazers_count,
        forks: ghData.forks_count,
        default_branch: ghData.default_branch,
      } : null,
      message: `Repository ${owner}/${repo} connected for ${email}`,
    })
  } catch (error) {
    console.error("Dev test error:", error)
    return NextResponse.json(
      { error: "Failed to connect repository", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve test data
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email') || 'test@sarge.dev'

    const pool = getDbPool()

    const result = await pool.query(
      `SELECT 
        u.email,
        u.name,
        r.owner,
        r.repo,
        r.full_name,
        r.is_primary,
        p.name as project_name,
        p.slug as project_slug
       FROM users u
       LEFT JOIN repositories r ON r.user_id = u.id AND r.is_primary = true
       LEFT JOIN projects p ON p.repository_id = r.id
       WHERE u.email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        message: "No test data found",
        hint: `POST to this endpoint to create test data for ${email}`,
      })
    }

    return NextResponse.json({
      testData: result.rows[0],
      message: "Test data retrieved successfully",
    })
  } catch (error) {
    console.error("Dev test error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve test data" },
      { status: 500 }
    )
  }
}
