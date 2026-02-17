import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { jobs } from '../lib/drizzle-schema'

export const jobsRouter = router({
    get: secureProcedure('jobs.get')
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const [job] = await ctx.drizzleDb
                .select()
                .from(jobs)
                .where(eq(jobs.id, input.id))

            if (!job) throw new TRPCError({ code: 'NOT_FOUND' })
            return job
        }),

    list: secureProcedure('jobs.list')
        .query(async ({ ctx }) => {
            return await ctx.drizzleDb
                .select()
                .from(jobs)
                .where(eq(jobs.userId, ctx.session?.user?.id || ''))
                .orderBy(jobs.createdAt)
        }),

    // In a real system, this would be updated by a worker
    updateStatus: secureProcedure('jobs.updateStatus')
        .input(z.object({
            id: z.string().uuid(),
            status: z.enum(['pending', 'processing', 'completed', 'failed']),
            result: z.any().optional(),
            error: z.string().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.drizzleDb
                .update(jobs)
                .set({
                    status: input.status,
                    result: input.result,
                    error: input.error,
                    updatedAt: new Date()
                })
                .where(eq(jobs.id, input.id))
            return { success: true }
        }),
})
