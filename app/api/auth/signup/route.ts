import { NextRequest, NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { createVerificationCode, sendVerificationEmail } from "@/lib/email-verification"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const pool = getDbPool()

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id, email_verified FROM users WHERE email = $1",
      [email]
    )

    if (existingUser.rows.length > 0) {
      // If user exists but not verified, resend code
      if (!existingUser.rows[0].email_verified) {
        const code = await createVerificationCode(email)
        await sendVerificationEmail(email, code)
        return NextResponse.json({
          message: "Verification code resent",
          requiresVerification: true,
        })
      }
      
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user (unverified)
    const userResult = await pool.query(
      `INSERT INTO users (email, name, email_verified) 
       VALUES ($1, $2, NULL) 
       RETURNING id, email, name`,
      [email, name || email.split("@")[0]]
    )

    const user = userResult.rows[0]

    // Store password hash
    await pool.query(
      `INSERT INTO user_credentials (user_id, password_hash) 
       VALUES ($1, $2)`,
      [user.id, passwordHash]
    )

    // Generate and send verification code
    const code = await createVerificationCode(email)
    await sendVerificationEmail(email, code)

    return NextResponse.json({
      message: "Signup successful! Check your email for verification code.",
      userId: user.id,
      requiresVerification: true,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
