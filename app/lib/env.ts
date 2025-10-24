import { z } from 'zod';

const envSchema = z.object({
  // Provide a safe development default to avoid build failures in CI/dev without secrets
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().default('pk_test_mock'),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
});

// This object is built at build time, so it's safe for the client.
// We pass the process.env variables that are prefixed with NEXT_PUBLIC_
// to avoid including server-side environment variables in the client-side bundle.
export const ENV = envSchema.parse({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
});
