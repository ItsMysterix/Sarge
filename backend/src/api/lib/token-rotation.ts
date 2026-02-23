
import { credLogger } from '../../lib/logger';
import { encryptCredentials, storeProviderCredentials } from './credentials';

interface OAuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    [key: string]: any;
}

/**
 * Token Rotation Engine
 * Handles background refresh of OAuth2 tokens for supported providers.
 */
export async function rotateProviderToken(
    providerId: string,
    credentials: Record<string, any>,
    db: any,
    userId: string
): Promise<Record<string, any>> {
    credLogger.info({ providerId, userId }, `[TokenRotation] Attempting to rotate tokens for ${providerId}`);

    let refreshUrl = '';
    let clientId = '';
    let clientSecret = '';

    switch (providerId) {
        case 'vercel':
            refreshUrl = 'https://api.vercel.com/v2/oauth/access_token';
            clientId = process.env.VERCEL_CLIENT_ID || '';
            clientSecret = process.env.VERCEL_CLIENT_SECRET || '';
            break;
        case 'netlify':
            refreshUrl = 'https://api.netlify.com/oauth/token';
            clientId = process.env.NETLIFY_CLIENT_ID || '';
            clientSecret = process.env.NETLIFY_CLIENT_SECRET || '';
            break;
        case 'fly':
            refreshUrl = 'https://api.fly.io/oauth/token';
            clientId = process.env.FLY_CLIENT_ID || '';
            clientSecret = process.env.FLY_CLIENT_SECRET || '';
            break;
        case 'railway':
            refreshUrl = 'https://backboard.railway.com/oauth/token';
            clientId = process.env.RAILWAY_CLIENT_ID || '';
            clientSecret = process.env.RAILWAY_CLIENT_SECRET || '';
            break;
        case 'heroku':
            refreshUrl = 'https://id.heroku.com/oauth/token';
            clientId = process.env.HEROKU_CLIENT_ID || '';
            clientSecret = process.env.HEROKU_CLIENT_SECRET || '';
            break;
        case 'digitalocean':
            refreshUrl = 'https://cloud.digitalocean.com/v1/oauth/token';
            clientId = process.env.DIGITALOCEAN_CLIENT_ID || '';
            clientSecret = process.env.DIGITALOCEAN_CLIENT_SECRET || '';
            break;
        case 'supabase':
            refreshUrl = 'https://api.supabase.com/v1/oauth/token';
            clientId = process.env.SUPABASE_CLIENT_ID || '';
            clientSecret = process.env.SUPABASE_CLIENT_SECRET || '';
            break;
        case 'planetscale':
            refreshUrl = 'https://auth.planetscale.com/oauth/token';
            clientId = process.env.PLANETSCALE_CLIENT_ID || '';
            clientSecret = process.env.PLANETSCALE_CLIENT_SECRET || '';
            break;
        case 'neon':
            refreshUrl = 'https://oauth2.neon.tech/token';
            clientId = process.env.NEON_CLIENT_ID || '';
            clientSecret = process.env.NEON_CLIENT_SECRET || '';
            break;
        case 'github':
            refreshUrl = 'https://github.com/login/oauth/access_token';
            clientId = process.env.GITHUB_ID || '';
            clientSecret = process.env.GITHUB_SECRET || '';
            break;
        case 'gitlab':
            refreshUrl = 'https://gitlab.com/oauth/token';
            clientId = process.env.GITLAB_CLIENT_ID || '';
            clientSecret = process.env.GITLAB_CLIENT_SECRET || '';
            break;
        case 'circleci':
            refreshUrl = 'https://circleci.com/oauth/token';
            clientId = process.env.CIRCLECI_CLIENT_ID || '';
            clientSecret = process.env.CIRCLECI_CLIENT_SECRET || '';
            break;
        case 'sentry':
            refreshUrl = 'https://sentry.io/oauth/token/';
            clientId = process.env.SENTRY_CLIENT_ID || '';
            clientSecret = process.env.SENTRY_CLIENT_SECRET || '';
            break;
        case 'datadog':
            refreshUrl = 'https://api.datadoghq.com/oauth2/v1/token';
            clientId = process.env.DATADOG_CLIENT_ID || '';
            clientSecret = process.env.DATADOG_CLIENT_SECRET || '';
            break;
        case 'stripe':
            refreshUrl = 'https://connect.stripe.com/oauth/token';
            clientId = process.env.STRIPE_CLIENT_ID || '';
            clientSecret = process.env.STRIPE_CLIENT_SECRET || '';
            break;
        case 'auth0':
            refreshUrl = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;
            clientId = process.env.AUTH0_CLIENT_ID || '';
            clientSecret = process.env.AUTH0_CLIENT_SECRET || '';
            break;
        case 'posthog':
            refreshUrl = 'https://app.posthog.com/oauth/token';
            clientId = process.env.POSTHOG_CLIENT_ID || '';
            clientSecret = process.env.POSTHOG_CLIENT_SECRET || '';
            break;
        case 'paypal':
            refreshUrl = 'https://api.paypal.com/v1/oauth2/token';
            clientId = process.env.PAYPAL_CLIENT_ID || '';
            clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
            break;
        default:
            // Fallback to Auth0 Bridge rotation if no specific provider secrets are set
            if (process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER) {
                const domain = process.env.AUTH0_DOMAIN || new URL(process.env.AUTH0_ISSUER || '').hostname;
                refreshUrl = `https://${domain}/oauth/token`;
                clientId = process.env.AUTH0_CLIENT_ID || '';
                clientSecret = process.env.AUTH0_CLIENT_SECRET || '';
                credLogger.info({ providerId }, `[TokenRotation] Using Auth0 Bridge fallback for ${providerId}`);
            } else {
                throw new Error(`Token rotation not supported for provider: ${providerId}`);
            }
    }

    if (!credentials.refresh_token) {
        throw new Error(`Missing refresh_token for ${providerId}`);
    }

    if (!clientId || !clientSecret) {
        throw new Error(`Client configuration missing for ${providerId} OAuth`);
    }

    try {
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: credentials.refresh_token,
        });

        const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            credLogger.error({ providerId, data }, `[TokenRotation] Refresh failed`);
            throw new Error(`Refresh failed: ${data.error_description || data.error || 'Unknown error'}`);
        }

        const newTokens: Record<string, any> = {
            ...credentials,
            access_token: data.access_token,
            // Some providers return a NEW refresh token (Refresh Token Rotation)
            refresh_token: data.refresh_token || credentials.refresh_token,
            expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
            updated_at: new Date().toISOString(),
        };

        // Store the updated tokens
        await storeProviderCredentials(providerId, newTokens, db, userId);

        credLogger.info({ providerId }, `[TokenRotation] Successfully rotated tokens for ${providerId}`);
        return newTokens;
    } catch (err) {
        credLogger.error({ providerId, err }, `[TokenRotation] Fatal error during rotation`);
        throw err;
    }
}

/**
 * Checks if a token is expired or expiring soon (within 5 minutes)
 */
export function isTokenExpired(credentials: Record<string, any>): boolean {
    if (!credentials.access_token || !credentials.expires_at) return false;

    const now = Math.floor(Date.now() / 1000);
    const buffer = 300; // 5 minute buffer

    return (credentials.expires_at - now) < buffer;
}
