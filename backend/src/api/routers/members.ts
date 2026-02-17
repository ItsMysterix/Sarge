import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'
import { users, projectMembers, projects } from '../lib/drizzle-schema'

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
                const result = await ctx.drizzleDb
                    .select({
                        id: users.id,
                        email: users.email,
                        name: users.name,
                        image: users.image,
                        role: projectMembers.role,
                        joinedAt: projectMembers.joinedAt
                    })
                    .from(projectMembers)
                    .innerJoin(users, eq(projectMembers.userId, users.id))
                    .where(eq(projectMembers.projectId, input.projectId))
                    .orderBy(projectMembers.joinedAt)

                if (result.length === 0) {
                    // Fallback: the project owner is always a member
                    const [project] = await ctx.drizzleDb
                        .select({ userId: projects.userId })
                        .from(projects)
                        .where(eq(projects.id, input.projectId))

                    if (project?.userId) {
                        const [user] = await ctx.drizzleDb
                            .select({
                                id: users.id,
                                email: users.email,
                                name: users.name,
                                image: users.image
                            })
                            .from(users)
                            .where(eq(users.id, project.userId))

                        if (user) {
                            return [{ ...user, role: 'owner', joinedAt: new Date() }]
                        }
                    }
                }

                return result
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
                const [user] = await ctx.drizzleDb
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.email, input.email))

                if (!user) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'User with this email not found in Sarge' })
                }

                // Check if already a member
                const [existing] = await ctx.drizzleDb
                    .select({ role: projectMembers.role })
                    .from(projectMembers)
                    .where(
                        and(
                            eq(projectMembers.projectId, input.projectId),
                            eq(projectMembers.userId, user.id)
                        )
                    )

                if (existing) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'User is already a member of this project' })
                }

                await ctx.drizzleDb.insert(projectMembers)
                    .values({
                        projectId: input.projectId,
                        userId: user.id,
                        role: input.role,
                        joinedAt: new Date()
                    })

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
                await ctx.drizzleDb
                    .update(projectMembers)
                    .set({ role: input.role })
                    .where(
                        and(
                            eq(projectMembers.projectId, input.projectId),
                            eq(projectMembers.userId, input.userId)
                        )
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
                await ctx.drizzleDb
                    .delete(projectMembers)
                    .where(
                        and(
                            eq(projectMembers.projectId, input.projectId),
                            eq(projectMembers.userId, input.userId)
                        )
                    )
                return { success: true }
            } catch (err) {
                console.error('[members.remove] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to remove member' })
            }
        }),
})
