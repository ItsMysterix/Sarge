
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../backend/src/api/root' 
export const trpc = createTRPCReact<AppRouter>()
