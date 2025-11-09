export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { neon } from "@neondatabase/serverless"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({
        email: session.user.email,
        name: session.user.name || "Developer",
        image: session.user.image,
      })
    }

    const users = await sql`
      SELECT id, email, name, image, created_at 
      FROM users 
      WHERE email = ${session.user.email}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        email: session.user.email,
        name: session.user.name || "Developer",
        image: session.user.image,
      })
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error("Failed to fetch user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const updates = await request.json()
    const { name } = updates

    if (!sql) {
      return NextResponse.json({
        email: session.user.email,
        name: name || session.user.name,
        image: session.user.image,
      })
    }

    const users = await sql`
      UPDATE users 
      SET name = ${name}
      WHERE email = ${session.user.email}
      RETURNING id, email, name, image, created_at
    `

    return NextResponse.json(users[0])
  } catch (error) {
    console.error("Failed to update user profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
