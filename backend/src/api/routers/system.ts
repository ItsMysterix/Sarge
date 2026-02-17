import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { publicProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const systemRouter = router({
    logError: publicProcedure
        .input(z.object({
            level: z.enum(['error', 'warn', 'info']).default('error'),
            source: z.string(),
            message: z.string(),
            stackTrace: z.string().optional(),
            context: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }: any) => {
            try {
                await ctx.db.query(
                    `INSERT INTO system_logs (level, source, message, stack_trace, context) 
           VALUES ($1, $2, $3, $4, $5)`,
                    [input.level, input.source, input.message, input.stackTrace, input.context]
                )
                return { success: true }
            } catch (error) {
                // Silently fail to avoid infinite error loops
                console.error('[system.logError] failed to log:', error)
                return { success: false }
            }
        }),

    getLogs: secureProcedure('system.getLogs')
        .query(async ({ ctx }: any) => {
            // In a real app, this would be admin-only
            try {
                const result = await ctx.db.query(
                    `SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100`
                )
                return { logs: result.rows }
            } catch (error) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }
        }),
})
