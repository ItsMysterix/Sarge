import { z } from "zod";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file if present
// Try multiple paths to find the .env file
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Backend loaded env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found, using environment variables');
}

const envSchema = z.object({
  DATABASE_URL: z.string().optional().default(''),
  WS_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  WS_ALLOWLIST: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default(''),
  WS_ALLOWED_ORIGINS: z.string().optional(),
  METRICS_ENABLE: z.union([z.boolean(), z.string()]).optional(),
  METRICS_PORT: z.coerce.number().int().positive().default(9091),
  PROM_METRICS_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_BURST: z.coerce.number().int().nonnegative().default(60),
  RATE_LIMIT_SCOPE: z.enum(['ip','user','ip_user']).default('ip'),
  MAX_WS_SUBSCRIPTIONS_PER_CONN: z.coerce.number().int().positive().default(16),
  MAX_WS_MSGS_PER_MIN: z.coerce.number().int().positive().default(240),
  MAX_JSON_BODY_KB: z.coerce.number().int().positive().default(512),
});

export const ENV = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // During Next.js build, backend modules may be imported but not actually used at runtime
    // Return a partial env object with safe defaults
    if (process.env.NODE_ENV !== 'production' || process.env.__NEXT_PHASE === 'phase-production-build') {
      console.warn('[backend/env] Returning partial ENV during build phase:', error);
      return {
        NODE_ENV: (process.env.NODE_ENV || 'development') as any,
        DATABASE_URL: '',
        WS_PORT: 3001,
        ALLOWED_ORIGINS: '',
        METRICS_ENABLE: false,
        METRICS_PORT: 9091,
        RATE_LIMIT_WINDOW_SEC: 60,
        RATE_LIMIT_MAX: 120,
        RATE_LIMIT_BURST: 60,
        RATE_LIMIT_SCOPE: 'ip' as const,
        MAX_WS_SUBSCRIPTIONS_PER_CONN: 16,
        MAX_WS_MSGS_PER_MIN: 240,
        MAX_JSON_BODY_KB: 512,
      };
    }
    throw error;
  }
})();

// Enforce metrics token in production
if (ENV.NODE_ENV === 'production') {
  // Make metrics token optional; if missing, metrics protection disabled
  if (!ENV.PROM_METRICS_TOKEN) {
    console.warn('PROM_METRICS_TOKEN missing in production; /metrics will be unsecured. Set one to protect metrics.')
  }
  if (!ENV.DATABASE_URL) {
    console.warn('DATABASE_URL missing; database-backed features will be disabled.')
  }
}

export type Env = typeof ENV;

export function parseAllowedOrigins(str: string | undefined | null): string[] {
  return (str || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function effectiveWsAllowedOrigins(): string[] {
  const ws = ENV.WS_ALLOWED_ORIGINS;
  const base = ws && ws.length > 0 ? ws : ENV.ALLOWED_ORIGINS;
  return parseAllowedOrigins(base);
}
