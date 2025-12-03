
import { createTRPCReact } from '@trpc/react-query'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../backend/src/api/root' 

// React hooks client
export const trpc = createTRPCReact<AppRouter>()

// Vanilla client for imperative calls (e.g., in event handlers)
export const trpcVanilla = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: typeof window !== 'undefined' ? '/api/trpc' : 'http://localhost:3000/api/trpc',
    }),
  ],
})
