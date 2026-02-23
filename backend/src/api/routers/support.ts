import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { apiLogger } from '../../lib/logger'

export const supportRouter = router({
    createTicket: secureProcedure('support.createTicket')
        .input(z.object({
            type: z.enum(['bug', 'feedback']),
            subject: z.string(),
            description: z.string(),
            priority: z.enum(['low', 'medium', 'high']).default('medium'),
            metadata: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }: any) => {
            const userId = ctx.userId
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' })
            }

            try {
                const result = await ctx.db.query(
                    `INSERT INTO support_tickets (user_id, type, subject, description, priority, metadata) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id`,
                    [userId, input.type, input.subject, input.description, input.priority, input.metadata]
                )

                // Create notification for the user
                await ctx.db.query(
                    `INSERT INTO notifications (user_id, title, message, type) 
           VALUES ($1, $2, $3, $4)`,
                    [
                        userId,
                        input.type === 'bug' ? 'Bug Report Submitted' : 'Feedback Received',
                        `Your ${input.type} report has been received. Ticket ID: ${result.rows[0].id}`,
                        'success'
                    ]
                )

                return { success: true, ticketId: result.rows[0].id }
            } catch (error) {
                apiLogger.error({ error, userId }, '[support.createTicket] Error')
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }
        }),

    listMyTickets: secureProcedure('support.listMyTickets')
        .query(async ({ ctx }: any) => {
            const userId = ctx.userId
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' })
            }

            try {
                const result = await ctx.db.query(
                    `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
                    [userId]
                )
                return { tickets: result.rows }
            } catch (error) {
                apiLogger.error({ error, userId }, '[support.listMyTickets] Error')
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
            }
        }),
})
