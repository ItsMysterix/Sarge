import { z } from "zod";
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config({ path: '../../.env' });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WS_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  // Deprecated legacy name (kept for compatibility)
  WS_ALLOWLIST: z.string().optional(),
  // HTTP CORS allowlist (comma-separated origins)
  ALLOWED_ORIGINS: z.string().default(''),
  // WS allowlist (optional; falls back to ALLOWED_ORIGINS)
  WS_ALLOWED_ORIGINS: z.string().optional(),
  // Prometheus metrics
  METRICS_ENABLE: z.union([z.boolean(), z.string()]).optional(),
  METRICS_PORT: z.coerce.number().int().positive().default(9091),
  PROM_METRICS_TOKEN: z.string().optional(),
  // Rate limiter config
  RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_BURST: z.coerce.number().int().nonnegative().default(60),
  RATE_LIMIT_SCOPE: z.enum(['ip','user','ip_user']).default('ip'),
  // WS & payload caps
  MAX_WS_SUBSCRIPTIONS_PER_CONN: z.coerce.number().int().positive().default(16),
  MAX_WS_MSGS_PER_MIN: z.coerce.number().int().positive().default(240),
  MAX_JSON_BODY_KB: z.coerce.number().int().positive().default(512),
});

export const ENV = envSchema.parse(process.env);

// Enforce metrics token in production
if (ENV.NODE_ENV === 'production' && !ENV.PROM_METRICS_TOKEN) {
  throw new Error('PROM_METRICS_TOKEN is required in production');
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
