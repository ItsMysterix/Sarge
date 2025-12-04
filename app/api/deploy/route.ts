export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any

export async function POST(request: Request) {
  try {
    const { branch = "main", image, ports, owner, repo, startPort, packageManager, type = "standard" } = await request.json()

    // Simulate deployment time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const commit = Math.random().toString(36).substring(2, 9)
    const status = Math.random() > 0.2 ? "success" : "failed"
    
    let summary: string
    if (type === "oneclick" && owner && repo) {
      summary = `${owner}/${repo} deployed to port ${startPort} using ${packageManager}`
    } else if (image) {
      summary = `Quick deploy: ${image} on ports ${ports?.join(', ') || 'default'}`
    } else {
      summary = `Deployment triggered from ${branch} branch`
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    try {
      const deployment = await sql`
        INSERT INTO deployments (branch, commit, status, summary, created_at)
        VALUES (${branch}, ${commit}, ${status}, ${summary}, ${new Date().toISOString()})
        RETURNING *
      `
      return NextResponse.json({
        success: true,
        deployment: deployment[0],
        message: `Deployment ${deployment[0].id} ${status}`,
      })
    } catch (dbError) {
      console.error("Database insert failed for deployment:", dbError)
      return NextResponse.json({ success: false, error: "Deployment persistence failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Deployment failed:", error)
    return NextResponse.json({ success: false, error: "Deployment failed" }, { status: 500 })
  }
}
