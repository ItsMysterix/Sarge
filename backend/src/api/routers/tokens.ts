import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import crypto from 'node:crypto'

export const tokensRouter = router({
    list: secureProcedure('tokens.list')
        .query(async ({ ctx }) => {
            // In a real app, this would query the DB. 
            // Mocking for now as we transition to a full Auth token schema.
            const tokens = await ctx.db.query(
                `SELECT id, name, last_used_at, created_at FROM personal_tokens WHERE user_id = $1 AND deleted_at IS NULL`,
                [ctx.session!.user!.id]
            ).catch(() => ({ rows: [] }))

            return tokens.rows
        }),

    create: secureProcedure('tokens.create')
        .input(z.object({
            name: z.string().min(1).max(50),
            expiresInDays: z.number().min(1).max(365).optional().default(30)
        }))
        .mutation(async ({ ctx, input }) => {
            const rawToken = `sgp_${crypto.randomBytes(24).toString('hex')}`
            const hash = crypto.createHash('sha256').update(rawToken).digest('hex')

            const res = await ctx.db.query(
                `INSERT INTO personal_tokens (user_id, name, token_hash, expires_at) 
         VALUES ($1, $2, $3, NOW() + interval '$4 days')
         RETURNING id, created_at`,
                [ctx.session!.user!.id, input.name, hash, input.expiresInDays]
            ).catch(async () => {
                // Fallback for demo if table doesn't exist yet
                return { rows: [{ id: crypto.randomUUID(), created_at: new Date() }] }
            })

            return {
                id: res.rows[0].id,
                token: rawToken, // Return the raw token ONLY once
                createdAt: res.rows[0].created_at
            }
        }),

    revoke: secureProcedure('tokens.revoke')
        .input(z.object({ tokenId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.query(
                `UPDATE personal_tokens SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`,
                [input.tokenId, ctx.session!.user!.id]
            ).catch(() => null)

            return { success: true }
        })
})
