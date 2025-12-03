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
    onError({ error, path, type, input }) {
      console.error('[tRPC API Route Error]', {
        path,
        type,
        code: error.code,
        message: error.message,
        cause: error.cause,
        input: JSON.stringify(input).substring(0, 200),
      });
    },
    responseMeta() {
      return {
        headers: {
          'x-trpc-source': 'next-fetch',
          'Cache-Control': 'no-store, must-revalidate',
        },
      };
    },
  }).catch((err) => {
    // Catch any unhandled errors from fetchRequestHandler itself
    console.error('[tRPC Handler Fatal Error]', err);
    return new Response(
      JSON.stringify({
        error: {
          message: err?.message || 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
}

export { handler as GET, handler as POST };
