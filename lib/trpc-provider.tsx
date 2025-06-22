'use client';

import { trpc } from '../lib/trpc';
import { createWSClient, wsLink } from '@trpc/client';
import superjson from 'superjson';
import { QueryClient } from '@tanstack/react-query';

const wsClient = createWSClient({
  url: 'ws://localhost:3200', // match your tRPC WebSocket server port
});

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
