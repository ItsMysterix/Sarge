import { getDbPool } from "./db"

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP in database with 10-minute expiration
 */
export async function createVerificationCode(email: string): Promise<string> {
  const pool = getDbPool()
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await pool.query(
    `INSERT INTO email_verification_codes (email, code, expires_at) 
     VALUES ($1, $2, $3)`,
    [email, code, expiresAt]
  )

  return code
}

/**
 * Verify OTP code
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const pool = getDbPool()
  
  const result = await pool.query(
    `DELETE FROM email_verification_codes 
     WHERE email = $1 AND code = $2 AND expires_at > NOW()
     RETURNING id`,
    [email, code]
  )

  return (result.rowCount ?? 0) > 0
}

/**
 * Clean up expired codes (run periodically)
 */
export async function cleanupExpiredCodes(): Promise<void> {
  const pool = getDbPool()
  await pool.query(`DELETE FROM email_verification_codes WHERE expires_at <= NOW()`)
}

/**
 * Send verification email (mock for now - integrate with your email service)
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // In development, just log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 VERIFICATION EMAIL (DEV MODE)
To: ${email}
Code: ${code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `)
    return
  }

  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  // Example with nodemailer:
  /*
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify Your Email - SARGE',
    html: `
      <h1>Welcome to SARGE</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `,
  })
  */
}
