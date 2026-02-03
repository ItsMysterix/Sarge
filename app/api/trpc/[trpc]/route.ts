import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Force dynamic so Vercel/Next doesn't cache tRPC responses
export const dynamic = 'force-dynamic';
// Ensure we run in the Node.js runtime (Anthropic SDK, Octokit, etc.)
export const runtime = 'nodejs';

// Optional: increase request body size limits if scans post larger payloads
export const maxDuration = 60; // seconds (Vercel Edge would be lower; Node allows more)

// Lazy load backend modules to avoid build-time evaluation
let appRouter: any;
let createContext: any;

async function getBackendModules() {
  if (!appRouter) {
    const rootModule = await import('../../../../backend/src/api/root');
    const contextModule = await import('../../../../backend/src/context');
    appRouter = rootModule.appRouter;
    createContext = contextModule.createContext;
  }
  return { appRouter, createContext };
}

async function handler(req: NextRequest) {
  // Lazy load backend modules at runtime to avoid build-time evaluation
  const { appRouter, createContext } = await getBackendModules();
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError({ error, path, type, input }) {
      console.error('[tRPC API Route Error]', {
        path,
        type,
        code: error.code,
        message: error.message,
        cause: error.cause,
        input: input ? JSON.stringify(input).substring(0, 200) : '(no input)',
      });
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
