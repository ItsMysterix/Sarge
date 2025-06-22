import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { appRouter } from '../api/root';

const wss = new ws.Server({ port: 3200 });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext: () => ({}),
});

console.log('✅ tRPC WebSocket running at ws://localhost:3200');
