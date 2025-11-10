'use client';

import { trpc } from '../lib/trpc';
import { createWSClient, wsLink } from '@trpc/client';
import superjson from 'superjson';
import { QueryClient } from '@tanstack/react-query';

function wsUrlFromEnv() {
  // Server-side render: use env only
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_WS_URL || '';

  // Prefer explicit env config (recommended for Vercel)
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  // Dev fallback: local ws server
  if (process.env.NODE_ENV === 'development') {
    return 'ws://localhost:3200';
  }

  // Production fallback: same-host /ws (requires reverse proxy)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${proto}://${window.location.host}/ws`;
  // Helpful hint if not set on Vercel
  // eslint-disable-next-line no-console
  console.warn('[trpc] NEXT_PUBLIC_WS_URL not set. Falling back to', url);
  return url;
}

const wsClient = createWSClient({ url: wsUrlFromEnv() });

export const TrpcProvider = trpc.Provider;

export function TrpcReactProvider({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider
      client={trpc.createClient({
        links: [
          wsLink({
            client: wsClient,
            transformer: superjson,
          }),
        ],
      })}
      queryClient={new QueryClient()}
    >
      {children}
    </TrpcProvider>
  );
}
