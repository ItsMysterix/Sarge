import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'

export const repositoryRouter = router({
  // Upsert a repository and optionally set it as primary; returns the record
  connect: publicProcedure
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      defaultBranch: z.string().default('main'),
      fullName: z.string().optional(),
      description: z.string().optional(),
      setPrimary: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Ensure user context (placeholder 'user_1')
        const userId = 'user_1'

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

        const repository = upsert.rows[0]

        // If setPrimary, clear others and set this one
        if (input.setPrimary) {
          await ctx.db.query(
            `UPDATE repositories SET is_primary = (id = $1) WHERE user_id = $2`,
            [repository.id, userId]
          )
        }

        return repository
      } catch (error) {
        console.error('[repository.connect] error:', error)
        throw new Error('Failed to connect repository')
      }
    }),

  // List repositories for current user
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const userId = 'user_1'
      const res = await ctx.db.query(
        `SELECT * FROM repositories WHERE user_id = $1 ORDER BY is_primary DESC, updated_at DESC`,
        [userId]
      )
      return res.rows
    } catch (error) {
      console.error('[repository.list] error:', error)
      return []
    }
  }),

  // Set primary repository by id
  setPrimary: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = 'user_1'
        await ctx.db.query(`UPDATE repositories SET is_primary = false WHERE user_id = $1`, [userId])
        await ctx.db.query(`UPDATE repositories SET is_primary = true WHERE id = $1 AND user_id = $2`, [input.id, userId])
        return { success: true }
      } catch (error) {
        console.error('[repository.setPrimary] error:', error)
        return { success: false }
      }
    }),
})
