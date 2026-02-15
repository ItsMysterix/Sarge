import { initTRPC } from '@trpc/server';
// import superjson from 'superjson';
import type { Context } from './context';

export const t = initTRPC.context<Context>().create({
  // transformer: superjson, // DISABLED: Version mismatch causing serialization crash
  errorFormatter({ shape, error }) {
    try {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Ensure error details are serializable
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      };
    } catch (formatterError) {
      // Fallback if formatting fails
      console.error('[tRPC] Error formatter failed:', formatterError);
      return {
        message: error.message || 'Internal server error',
        code: shape.code || 'INTERNAL_SERVER_ERROR',
        data: {
          code: shape.code || 'INTERNAL_SERVER_ERROR',
          httpStatus: shape.data?.httpStatus || 500,
        },
      } as any;
    }
  },
});

export const router = t.router;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
