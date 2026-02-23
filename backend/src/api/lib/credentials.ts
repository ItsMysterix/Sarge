import * as crypto from 'crypto'
import { credLogger } from '../../lib/logger';

/**
 * Credential injection layer
 * 
 * Reads provider credentials from:
 * 1. Environment variables (for quick setup)
 * 2. Database (encrypted storage for production)
 * 
 * When user adds tokens to .env, they're automatically picked up.
 * When stored in DB, they're encrypted at rest.
 */

interface ProviderCredentials {
  [key: string]: string
}

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY

function getFinalKey() {
  if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: CREDENTIAL_ENCRYPTION_KEY is missing in production environment.')
  }
  return ENCRYPTION_KEY || 'default-dev-key-change-in-prod-32b'
}

/**
 * Encrypt credentials before storing in database
 */
export function encryptCredentials(plaintext: string): string {
  try {
    const key = Buffer.from(getFinalKey().slice(0, 32).padEnd(32, '0'))
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Return iv + encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (err) {
    credLogger.error({ msg: '[credentials] Encryption error', err })
    throw new Error('Failed to encrypt credentials')
  }
}

/**
 * Decrypt credentials when retrieving from database
 */
export function decryptCredentials(encrypted: string): string {
  try {
    const key = Buffer.from(getFinalKey().slice(0, 32).padEnd(32, '0'))
    const [ivHex, encryptedData] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (err) {
    credLogger.error({ msg: '[credentials] Decryption error', err })
    throw new Error('Failed to decrypt credentials')
  }
}

/**
 * Mask sensitive credentials for logging/display
 * Shows first 4 and last 4 characters: sk-1234...abcd
 */
export function maskCredential(credential: string): string {
  if (!credential || credential.length < 12) {
    return '****'
  }
  const start = credential.slice(0, 4)
  const end = credential.slice(-4)
  return `${start}...${end}`
}

/**
 * Get credentials for a provider
 * Tries in order:
 * 1. Environment variables (VERCEL_TOKEN, RAILWAY_TOKEN, etc.)
 * 2. Database (encrypted provider_credentials table)
 * 3. Returns empty object if not found (graceful fallback)
 */
export async function getProviderCredentials(
  providerId: string,
  db: any,
  userId?: string
): Promise<ProviderCredentials> {
  const credentials: ProviderCredentials = {}

  // Environment variable mapping
  const envMap: Record<string, string> = {
    vercel: 'VERCEL_TOKEN',
    railway: 'RAILWAY_TOKEN',
    render: 'RENDER_TOKEN',
    cloudflare: 'CLOUDFLARE_TOKEN',
    aws: 'AWS_ACCESS_KEY_ID', // Also need AWS_SECRET_ACCESS_KEY
    fly: 'FLY_API_TOKEN',
    gcp: 'GCP_SERVICE_ACCOUNT_KEY', // Also need GCP_PROJECT_ID
    azure: 'AZURE_TENANT_ID', // Also need AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID
  }

  // 1. Try environment variables first (instant setup)
  const envVar = envMap[providerId]
  if (envVar && process.env[envVar]) {
    credLogger.info({ providerId, envVar }, `[credentials] Using ${envVar} from environment`)
    credentials[`${providerId}_token`] = process.env[envVar] as string

    // AWS special case: needs both access key and secret
    if (providerId === 'aws' && process.env.AWS_SECRET_ACCESS_KEY) {
      credentials.aws_secret = process.env.AWS_SECRET_ACCESS_KEY
      credentials.aws_region = process.env.AWS_REGION || 'us-east-1'
    }

    // GCP special case: needs service account key and project ID
    if (providerId === 'gcp' && process.env.GCP_PROJECT_ID) {
      credentials.gcp_service_account_key = process.env.GCP_SERVICE_ACCOUNT_KEY || ''
      credentials.gcp_project_id = process.env.GCP_PROJECT_ID
      credentials.gcp_region = process.env.GCP_REGION || 'us-central1'
    }

    // Azure special case: needs multiple credentials
    if (providerId === 'azure') {
      credentials.azure_tenant_id = process.env.AZURE_TENANT_ID || ''
      credentials.azure_client_id = process.env.AZURE_CLIENT_ID || ''
      credentials.azure_client_secret = process.env.AZURE_CLIENT_SECRET || ''
      credentials.azure_subscription_id = process.env.AZURE_SUBSCRIPTION_ID || ''
      credentials.azure_resource_group = process.env.AZURE_RESOURCE_GROUP || 'sarge-deployments'
      credentials.azure_region = process.env.AZURE_REGION || 'eastus'
    }

    return credentials
  }

  // 2. Try database (encrypted storage)
  try {
    const result = await db.query(
      `SELECT credentials_encrypted, metadata 
       FROM provider_credentials 
       WHERE provider_id = $1 AND (user_id = $2 OR user_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 1`,
      [providerId, userId || null]
    ).catch((err: any) => {
      // Table doesn't exist yet - return empty
      if (err?.message?.includes('provider_credentials')) {
        credLogger.info('[credentials] provider_credentials table not found, using env vars only');
        return null
      }
      throw err
    })

    if (result?.rows?.[0]) {
      const encrypted = result.rows[0].credentials_encrypted
      const decrypted = decryptCredentials(encrypted)
      const parsed = JSON.parse(decrypted)

      credLogger.info({ providerId }, `Using credentials from database for ${providerId}`);
      return parsed
    }
  } catch (err) {
    credLogger.warn({ providerId, err }, `[credentials] Database lookup failed for ${providerId}`);
  }

  // 3. Return empty (provider will handle missing creds gracefully)
  credLogger.info({ providerId }, `[credentials] No credentials found for ${providerId} - will use mock/local fallback`);
  return credentials
}

/**
 * Store provider credentials in database (encrypted)
 * Call this when user connects a provider via OAuth or manual token input
 */
export async function storeProviderCredentials(
  providerId: string,
  credentials: ProviderCredentials,
  db: any,
  userId?: string
): Promise<void> {
  try {
    const plaintext = JSON.stringify(credentials)
    const encrypted = encryptCredentials(plaintext)

    // Upsert credentials
    await db.query(
      `INSERT INTO provider_credentials (provider_id, user_id, credentials_encrypted, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (provider_id, user_id) 
       DO UPDATE SET credentials_encrypted = $3, updated_at = NOW()`,
      [providerId, userId || null, encrypted]
    ).catch((err: any) => {
      if (err?.message?.includes('provider_credentials')) {
        credLogger.warn('[credentials] Table not migrated yet, skipping DB storage')
        return
      }
      throw err
    })

    credLogger.info({ providerId }, `[credentials] Stored encrypted credentials for ${providerId}`)
  } catch (err) {
    credLogger.error({ msg: `[credentials] Failed to store credentials for ${providerId}`, providerId, err })
    throw err
  }
}

/**
 * Delete provider credentials (disconnect)
 */
export async function deleteProviderCredentials(
  providerId: string,
  db: any,
  userId?: string
): Promise<void> {
  try {
    await db.query(
      `DELETE FROM provider_credentials 
       WHERE provider_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [providerId, userId || null]
    ).catch((err: any) => {
      if (err?.message?.includes('provider_credentials')) {
        credLogger.warn('[credentials] Table not migrated yet')
        return
      }
      throw err
    })

    credLogger.info({ providerId }, `[credentials] Deleted credentials for ${providerId}`)
  } catch (err) {
    credLogger.error({ msg: `[credentials] Failed to delete credentials for ${providerId}`, providerId, err })
    throw err
  }
}
