'use client';

import { trpc } from '../lib/trpc';
import { createWSClient, wsLink } from '@trpc/client';
import superjson from 'superjson';
import { QueryClient } from '@tanstack/react-query';

function wsUrlFromEnv() {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_WS_URL || '';
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
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
