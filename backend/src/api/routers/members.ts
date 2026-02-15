import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

/**
 * Members Router
 * 
 * Manages project team composition and roles:
 * - Listing members
 * - Inviting new users
 * - Role management (Admin, Developer, Viewer)
 */

export const membersRouter = router({
    list: secureProcedure('members.list')
        .input(z.object({
            projectId: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const result = await ctx.db.query(
                    `SELECT u.id, u.email, u.name, u.image, pm.role, pm.joined_at
           FROM project_members pm
           JOIN users u ON pm.user_id = u.id
           WHERE pm.project_id = $1
           ORDER BY pm.joined_at ASC`,
                    [input.projectId]
                ).catch(async (err: any) => {
                    if (err?.message?.includes('project_members')) {
                        // Fallback: the project owner is always a member
                        const projectPrompt = ctx.db.query(
                            `SELECT user_id FROM projects WHERE id = $1`,
                            [input.projectId]
                        ).then(async (res: any) => {
                            const userId = res.rows[0]?.user_id;
                            if (userId) {
                                const user = await ctx.db.query(`SELECT id, email, name, image FROM users WHERE id = $1`, [userId]);
                                return [{ ...user.rows[0], role: 'owner', joined_at: new Date() }];
                            }
                            return [];
                        })
                        return { rows: await projectPrompt }
                    }
                    throw err
                })

                return result?.rows || []
            } catch (err) {
                console.error('[members.list] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch members' })
            }
        }),

    invite: secureProcedure('members.invite')
        .input(z.object({
            projectId: z.string().uuid(),
            email: z.string().email(),
            role: z.enum(['admin', 'developer', 'viewer']).default('developer'),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                // Find user by email
                const userResult = await ctx.db.query(
                    `SELECT id FROM users WHERE email = $1`,
                    [input.email]
                )

                if (!userResult.rows[0]) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'User with this email not found in Sarge' })
                }

                const userId = userResult.rows[0].id

                // Check if already a member
                const existing = await ctx.db.query(
                    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
                    [input.projectId, userId]
                ).catch(() => ({ rows: [] }))

                if (existing?.rows?.[0]) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'User is already a member of this project' })
                }

                await ctx.db.query(
                    `INSERT INTO project_members (project_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, NOW())`,
                    [input.projectId, userId, input.role]
                )

                return { success: true }
            } catch (err) {
                if (err instanceof TRPCError) throw err
                console.error('[members.invite] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to invite member' })
            }
        }),

    updateRole: secureProcedure('members.updateRole')
        .input(z.object({
            projectId: z.string().uuid(),
            userId: z.string(),
            role: z.enum(['admin', 'developer', 'viewer']),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.query(
                    `UPDATE project_members 
           SET role = $1 
           WHERE project_id = $2 AND user_id = $3`,
                    [input.role, input.projectId, input.userId]
                )
                return { success: true }
            } catch (err) {
                console.error('[members.updateRole] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update member role' })
            }
        }),

    remove: secureProcedure('members.remove')
        .input(z.object({
            projectId: z.string().uuid(),
            userId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.query(
                    `DELETE FROM project_members 
           WHERE project_id = $1 AND user_id = $2`,
                    [input.projectId, input.userId]
                )
                return { success: true }
            } catch (err) {
                console.error('[members.remove] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to remove member' })
            }
        }),
})
