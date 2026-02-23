import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import crypto from 'node:crypto'
import { authLogger } from '../../lib/logger'
import { TRPCError } from '@trpc/server'

export const tokensRouter = router({
    list: secureProcedure('tokens.list')
        .query(async ({ ctx }) => {
            try {
                const tokens = await ctx.db.query(
                    `SELECT id, name, last_used_at, created_at FROM personal_tokens WHERE user_id = $1 AND deleted_at IS NULL`,
                    [ctx.session!.user!.id]
                )
                return tokens?.rows || []
            } catch (error) {
                authLogger.error({ error, userId: ctx.session?.user?.id }, '[tokens.list] Failed to fetch tokens')
                return []
            }
        }),

    create: secureProcedure('tokens.create')
        .input(z.object({
            name: z.string().min(1).max(50),
            expiresInDays: z.number().min(1).max(365).optional().default(30)
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const rawToken = `sgp_${crypto.randomBytes(24).toString('hex')}`
                const hash = crypto.createHash('sha256').update(rawToken).digest('hex')

                const res = await ctx.db.query(
                    `INSERT INTO personal_tokens (user_id, name, token_hash, expires_at) 
             VALUES ($1, $2, $3, NOW() + interval '$4 days')
             RETURNING id, created_at`,
                    [ctx.session!.user!.id, input.name, hash, input.expiresInDays]
                )

                if (!res?.rows?.[0]) throw new Error('Failed to insert token')

                return {
                    id: res.rows[0].id,
                    token: rawToken, // Return the raw token ONLY once
                    createdAt: res.rows[0].created_at
                }
            } catch (error) {
                authLogger.error({ error, input, userId: ctx.session?.user?.id }, '[tokens.create] Failed to create token')
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create personal access token'
                })
            }
        }),

    revoke: secureProcedure('tokens.revoke')
        .input(z.object({ tokenId: z.string() })) // Relaxed validation to match frontend usage if needed, but it should be uuid
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.query(
                    `UPDATE personal_tokens SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`,
                    [input.tokenId, ctx.session!.user!.id]
                )
                return { success: true }
            } catch (error) {
                authLogger.error({ error, input, userId: ctx.session?.user?.id }, '[tokens.revoke] Failed to revoke token')
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to revoke token'
                })
            }
        })
})
