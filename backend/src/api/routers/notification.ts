import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { apiLogger } from '../../lib/logger'

export const notificationRouter = router({
    list: secureProcedure('notification.list')
        .query(async ({ ctx }: any) => {
            const userId = (ctx as any).userId
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' })
            }

            try {
                // Return latest 20 notifications
                const result = await ctx.db.query(
                    `SELECT * FROM notifications 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 20`,
                    [userId]
                )
                return { notifications: result.rows }
            } catch (error) {
                apiLogger.error({ error, userId }, '[notification.list] Error')
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }
        }),

    markAsRead: secureProcedure('notification.markAsRead')
        .input(z.object({ ids: z.array(z.string().uuid()).optional() })) // Optional ids, if missing mark all
        .mutation(async ({ ctx, input }: any) => {
            const userId = (ctx as any).userId
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' })
            }

            try {
                if (input.ids && input.ids.length > 0) {
                    // Mark specific
                    await ctx.db.query(
                        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND id = ANY($2)`,
                        [userId, input.ids]
                    )
                } else {
                    // Mark all
                    await ctx.db.query(
                        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
                        [userId]
                    )
                }
                return { success: true }
            } catch (error) {
                apiLogger.error({ error, userId }, '[notification.markAsRead] Error')
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }
        }),

    // Optional: Create notification (mostly for internal testing or client-side generation via API)
    create: secureProcedure('notification.create')
        .input(z.object({
            title: z.string(),
            message: z.string().optional(),
            type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
        }))
        .mutation(async ({ ctx, input }: any) => {
            const userId = (ctx as any).userId
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' })
            }

            await ctx.db.query(
                `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
                [userId, input.title, input.message, input.type]
            )
            return { success: true }
        }),
})
