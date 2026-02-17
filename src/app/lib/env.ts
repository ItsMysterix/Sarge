import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
});

// This object is built at build time, so it's safe for the client.
// We pass the process.env variables that are prefixed with NEXT_PUBLIC_
// to avoid including server-side environment variables in the client-side bundle.
export const ENV = envSchema.parse({
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
});
