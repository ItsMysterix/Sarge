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

import { Resend } from 'resend';

let resend: Resend | null = null;

/**
 * Send verification email via Resend
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // In development, just log to console
  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 VERIFICATION EMAIL (DEV MODE)
To: ${email}
Code: ${code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `)
    return
  }

  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  if (!resend) {
    console.warn('[email] Resend client not initialized, falling back to console log');
    return;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.SMTP_FROM || 'Sarge <noreply@sarge.dev>',
    to: [email],
    subject: 'Verify Your Email - SARGE Command Center',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #0f0f0f; 
            color: #fff; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #00ff9f;
            margin-bottom: 10px;
          }
          .code { 
            font-size: 36px; 
            font-weight: bold; 
            color: #00ff9f; 
            letter-spacing: 12px; 
            text-align: center;
            padding: 24px;
            background: rgba(0, 255, 159, 0.1);
            border: 2px solid rgba(0, 255, 159, 0.3);
            border-radius: 8px;
            margin: 30px 0;
          }
          .content {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            color: #888; 
            font-size: 12px; 
          }
          .status {
            display: inline-block;
            color: #00ff9f;
            font-size: 11px;
            margin-top: 10px;
          }
          .status::before {
            content: "●";
            margin-right: 5px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ SARGE</div>
            <p style="color: #888; font-size: 14px;">DevOps Command Center</p>
          </div>
          
          <div class="content">
            <h2 style="margin-top: 0; color: #fff;">Verify Your Email Address</h2>
            <p style="color: #ccc;">Welcome to SARGE! Use the verification code below to complete your registration:</p>
            
            <div class="code">${code}</div>
            
            <p style="color: #ccc;">This code will expire in <strong style="color: #00ff9f;">10 minutes</strong>.</p>
            
            <p style="color: #888; font-size: 13px; margin-top: 30px;">
              If you didn't request this code, you can safely ignore this email. Your account will not be created.
            </p>
          </div>
          
          <div class="footer">
            <p>SARGE v2.0 • Secure DevOps Command Center</p>
            <div class="status">SYSTEM ONLINE</div>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('[email] Resend error:', error);
    throw new Error('Failed to send verification email');
  }
}

