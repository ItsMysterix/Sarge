import * as crypto from "crypto"
import { getDbPool } from "@/lib/db"

interface ProviderCredentials {
  [key: string]: string | undefined
}

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || "default-dev-key-change-in-prod-32b"

function encryptCredentials(plaintext: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0"))
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  return iv.toString("hex") + ":" + encrypted
}

function decryptCredentials(encrypted: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0"))
  const [ivHex, encryptedData] = encrypted.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)

  let decrypted = decipher.update(encryptedData, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

export async function storeProviderCredentials(
  providerId: string,
  credentials: ProviderCredentials,
  userKey: string
): Promise<void> {
  const db = getDbPool()
  const plaintext = JSON.stringify(credentials)
  const encrypted = encryptCredentials(plaintext)

  try {
    await db.query(
      `INSERT INTO provider_credentials (provider_id, user_id, credentials_encrypted, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (provider_id, user_id)
       DO UPDATE SET credentials_encrypted = $3, updated_at = NOW()`,
      [providerId, userKey, encrypted]
    )
  } catch (err: any) {
    if (err?.message?.includes("provider_credentials")) {
      console.warn("[credentials] provider_credentials table not found, skipping storage")
      return
    }
    throw err
  }
}

export async function getProviderCredentials(
  providerId: string,
  userKey: string
): Promise<ProviderCredentials> {
  const db = getDbPool()

  try {
    const result = await db.query(
      `SELECT credentials_encrypted
       FROM provider_credentials
       WHERE provider_id = $1 AND user_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [providerId, userKey]
    )

    if (result.rows?.[0]?.credentials_encrypted) {
      const decrypted = decryptCredentials(result.rows[0].credentials_encrypted)
      return JSON.parse(decrypted)
    }
  } catch (err: any) {
    if (err?.message?.includes("provider_credentials")) {
      console.warn("[credentials] provider_credentials table not found")
      return {}
    }
    throw err
  }

  return {}
}

export async function getGithubAccessToken(userKey: string): Promise<string | null> {
  const creds = await getProviderCredentials("github", userKey)
  return (creds.access_token as string) || null
}
