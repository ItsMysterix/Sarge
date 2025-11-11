'use client';

import { trpc } from '../lib/trpc';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { QueryClient } from '@tanstack/react-query';

export const TrpcProvider = trpc.Provider;

export function TrpcReactProvider({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider
      client={trpc.createClient({
        links: [
          httpBatchLink({
            url: '/api/trpc',
            transformer: superjson,
            headers() {
              return {
                // You can forward auth headers or custom tokens here
              };
            },
          }),
        ],
      })}
      queryClient={new QueryClient()}
    >
      {children}
    </TrpcProvider>
  );
}
