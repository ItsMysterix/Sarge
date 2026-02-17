import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, and, sql } from 'drizzle-orm'
import { users, projectMembers, projects, memberInvitations } from '../lib/drizzle-schema'
import crypto from 'crypto'

/**
 * Members Router
 * 
 * Manages project team composition and roles:
 * - Listing members
 * - Inviting new users (via secure tokens)
 * - Role management (Admin, Developer, Viewer)
 */

export const membersRouter = router({
    list: secureProcedure('members.list')
        .input(z.object({
            projectId: z.string().uuid(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                // Get confirmed members
                const confirmed = await ctx.drizzleDb
                    .select({
                        id: users.id,
                        email: users.email,
                        name: users.name,
                        image: users.image,
                        role: projectMembers.role,
                        joinedAt: projectMembers.joinedAt,
                        status: sql<string>`'active'`
                    })
                    .from(projectMembers)
                    .innerJoin(users, eq(projectMembers.userId, users.id))
                    .where(eq(projectMembers.projectId, input.projectId))

                // Get pending invitations
                const pending = await ctx.drizzleDb
                    .select({
                        id: memberInvitations.id,
                        email: memberInvitations.email,
                        name: sql<string>`NULL`,
                        image: sql<string>`NULL`,
                        role: memberInvitations.role,
                        joinedAt: memberInvitations.createdAt,
                        status: memberInvitations.status
                    })
                    .from(memberInvitations)
                    .where(
                        and(
                            eq(memberInvitations.projectId, input.projectId),
                            eq(memberInvitations.status, 'pending')
                        )
                    )

                const allMembers = [...confirmed, ...pending]

                if (allMembers.length === 0) {
                    // Fallback to project owner
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
                            return [{ ...user, role: 'owner', joinedAt: new Date(), status: 'active' }]
                        }
                    }
                }

                return allMembers
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
                // Check if user is already a member
                const [existingUser] = await ctx.drizzleDb
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.email, input.email))

                if (existingUser) {
                    const [isMember] = await ctx.drizzleDb
                        .select({ role: projectMembers.role })
                        .from(projectMembers)
                        .where(
                            and(
                                eq(projectMembers.projectId, input.projectId),
                                eq(projectMembers.userId, existingUser.id)
                            )
                        )
                    if (isMember) {
                        throw new TRPCError({ code: 'CONFLICT', message: 'User is already a project member' })
                    }
                }

                // Create or update invitation
                const token = crypto.randomBytes(32).toString('hex')
                const expiresAt = new Date()
                expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

                // Upsert invitation (revoking existing one if any)
                await ctx.drizzleDb
                    .insert(memberInvitations)
                    .values({
                        projectId: input.projectId,
                        email: input.email.toLowerCase(),
                        role: input.role,
                        token,
                        invitedBy: ctx.session?.user?.id || 'system',
                        expiresAt,
                        status: 'pending'
                    })
                    .onConflictDoUpdate({
                        target: [memberInvitations.projectId, memberInvitations.email],
                        set: {
                            token,
                            role: input.role,
                            expiresAt,
                            status: 'pending',
                            createdAt: new Date()
                        }
                    })

                // Logic to send email would go here
                // console.log(`[Invitation Link]: /join?token=${token}`)

                return { success: true, token }
            } catch (err) {
                if (err instanceof TRPCError) throw err
                console.error('[members.invite] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create invitation' })
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

    revokeInvitation: secureProcedure('members.revokeInvitation')
        .input(z.object({
            projectId: z.string().uuid(),
            invitationId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.drizzleDb
                    .delete(memberInvitations)
                    .where(
                        and(
                            eq(memberInvitations.id, input.invitationId),
                            eq(memberInvitations.projectId, input.projectId)
                        )
                    )
                return { success: true }
            } catch (err) {
                console.error('[members.revokeInvitation] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to revoke invitation' })
            }
        }),

    acceptInvitation: secureProcedure('members.acceptInvitation')
        .input(z.object({
            token: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const [invitation] = await ctx.drizzleDb
                    .select()
                    .from(memberInvitations)
                    .where(
                        and(
                            eq(memberInvitations.token, input.token),
                            eq(memberInvitations.status, 'pending')
                        )
                    )

                if (!invitation) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or expired invitation' })
                }

                if (invitation.expiresAt < new Date()) {
                    await ctx.drizzleDb.update(memberInvitations).set({ status: 'expired' }).where(eq(memberInvitations.id, invitation.id))
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation has expired' })
                }

                // Add to project members
                await ctx.drizzleDb.insert(projectMembers).values({
                    projectId: invitation.projectId,
                    userId: ctx.session?.user?.id || 'unknown',
                    role: invitation.role,
                    joinedAt: new Date()
                })

                // Mark as accepted
                await ctx.drizzleDb.update(memberInvitations)
                    .set({ status: 'accepted' })
                    .where(eq(memberInvitations.id, invitation.id))

                return { success: true, projectId: invitation.projectId }
            } catch (err) {
                if (err instanceof TRPCError) throw err
                console.error('[members.acceptInvitation] Error:', err)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to accept invitation' })
            }
        }),
})
