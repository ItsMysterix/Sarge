import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const deployments = await sql`
      SELECT * FROM deployments 
      ORDER BY created_at DESC 
      LIMIT 20
    `

    if (deployments.length === 0) {
      // Return mock data if no deployments found
      return NextResponse.json([
        {
          id: "1",
          branch: "main",
          commit: "a7f3c2d",
          status: "success",
          summary: "Deployment completed successfully",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          branch: "feature/auth",
          commit: "b8e4d3f",
          status: "failed",
          summary: "Failed due to database migration timeout",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ])
    }

    return NextResponse.json(deployments)
  } catch (error) {
    console.error("Failed to fetch deployments:", error)

    // Return mock data if database error (table doesn't exist, etc.)
    return NextResponse.json([
      {
        id: "1",
        branch: "main",
        commit: "a7f3c2d",
        status: "success",
        summary: "Deployment completed successfully",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        branch: "feature/auth",
        commit: "b8e4d3f",
        status: "failed",
        summary: "Failed due to database migration timeout",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ])
  }
}
