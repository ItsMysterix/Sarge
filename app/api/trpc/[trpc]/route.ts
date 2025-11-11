import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { AnyRouter } from '@trpc/server';
import { appRouter } from '../../../../backend/src/api/root';
import { createContext } from '../../../../backend/src/context';

// Force dynamic so Vercel/Next doesn't cache tRPC responses
export const dynamic = 'force-dynamic';
// Ensure we run in the Node.js runtime (Anthropic SDK, Octokit, etc.)
export const runtime = 'nodejs';

// Optional: increase request body size limits if scans post larger payloads
export const maxDuration = 60; // seconds (Vercel Edge would be lower; Node allows more)

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter as unknown as AnyRouter,
    createContext: () => createContext({ req: request }),
    batching: { enabled: true },
    onError({ error, path }) {
      console.error('[tRPC error]', path, error);
    },
    responseMeta() {
      return {
        headers: {
          'x-trpc-source': 'next-fetch',
        },
      };
    },
  });
}

export { handler as GET, handler as POST };
