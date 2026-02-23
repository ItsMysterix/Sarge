import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import logger from './lib/logger';

export const t = initTRPC.context<Context>().create({
  // transformer: superjson, // DISABLED: Version mismatch causing serialization crash
  errorFormatter({ shape, error }) {
    // Log complete error on server for observability via Pino
    logger.error({
      msg: `[tRPC Error] ${shape.code}`,
      code: shape.code,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    try {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Expose stack trace only in development
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
