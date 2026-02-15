import { z } from 'zod'
import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { TRPCError } from '@trpc/server'

export const repositoryRouter = router({
  // Upsert a repository and optionally set it as primary; returns the record
  connect: secureProcedure('repository.connect')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      defaultBranch: z.string().default('main'),
      fullName: z.string().optional(),
      description: z.string().optional(),
      setPrimary: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      // Upsert repository
      const upsert = await ctx.db.query(
        `INSERT INTO repositories (id, user_id, owner, repo, full_name, description, branch, is_primary)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, owner, repo)
         DO UPDATE SET full_name = EXCLUDED.full_name, description = EXCLUDED.description, branch = EXCLUDED.branch
         RETURNING *`,
        [
          userId,
          input.owner,
          input.repo,
          input.fullName ?? `${input.owner}/${input.repo}`,
          input.description ?? null,
          input.defaultBranch,
          !!input.setPrimary,
        ]
      )

      if (!upsert || !upsert.rows || upsert.rows.length === 0) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upsert repository' });
      }

      const repository = upsert.rows[0]

      // If setPrimary, clear others and set this one
      if (input.setPrimary) {
        await ctx.db.query(
          `UPDATE repositories SET is_primary = (id = $1) WHERE user_id = $2`,
          [repository.id, userId]
        )
      }

      return repository
    }),

  // List repositories for current user
  list: secureProcedure('repository.list').query(async ({ ctx }) => {
    const userId = (ctx as any).userId;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    const res = await ctx.db.query(
      `SELECT * FROM repositories WHERE user_id = $1 ORDER BY is_primary DESC, updated_at DESC`,
      [userId]
    )
    return res.rows
  }),

  // Set primary repository by id
  setPrimary: secureProcedure('repository.setPrimary')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      await ctx.db.query(`UPDATE repositories SET is_primary = false WHERE user_id = $1`, [userId])
      await ctx.db.query(`UPDATE repositories SET is_primary = true WHERE id = $1 AND user_id = $2`, [input.id, userId])
      return { success: true }
    }),
})
