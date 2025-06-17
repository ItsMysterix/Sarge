import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { branch = "main" } = await request.json()

    // Simulate deployment time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const commit = Math.random().toString(36).substring(2, 9)
    const status = Math.random() > 0.2 ? "success" : "failed"

    try {
      // Try to insert deployment record
      const deployment = await sql`
        INSERT INTO deployments (branch, commit, status, summary, created_at)
        VALUES (${branch}, ${commit}, ${status}, ${`Deployment triggered from ${branch} branch`}, ${new Date().toISOString()})
        RETURNING *
      `

      return NextResponse.json({
        success: true,
        deployment: deployment[0],
        message: `Deployment ${deployment[0].id} ${status}`,
      })
    } catch (dbError) {
      // If database insert fails, return mock deployment
      const mockDeployment = {
        id: Math.random().toString(36).substring(2, 9),
        branch,
        commit,
        status,
        summary: `Deployment triggered from ${branch} branch`,
        created_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        deployment: mockDeployment,
        message: `Deployment ${mockDeployment.id} ${status}`,
      })
    }
  } catch (error) {
    console.error("Deployment failed:", error)
    return NextResponse.json({ success: false, error: "Deployment failed" }, { status: 500 })
  }
}
