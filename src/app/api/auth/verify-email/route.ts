import { NextRequest, NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { verifyCode } from "@/lib/email-verification"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      )
    }

    // Verify the code
    const isValid = await verifyCode(email, code)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    // Mark user as verified
    const pool = getDbPool()
    await pool.query(
      `UPDATE users SET email_verified = NOW() WHERE email = $1`,
      [email]
    )

    return NextResponse.json({
      message: "Email verified successfully! You can now sign in.",
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
