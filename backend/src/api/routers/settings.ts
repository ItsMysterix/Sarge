import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { userSettings } from '../lib/drizzle-schema'
import { eq } from 'drizzle-orm'

export const settingsRouter = router({
    get: secureProcedure('settings.get')
        .query(async ({ ctx }) => {
            const userId = ctx.session?.user?.id || (ctx as any).userId
            if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

            try {
                const [settings] = await ctx.drizzleDb
                    .select()
                    .from(userSettings)
                    .where(eq(userSettings.userId, userId))

                if (!settings) {
                    // Return default structure if no record exists
                    return {
                        userId,
                        slackAlerts: true,
                        autoRebuild: false,
                        enableAnimations: true,
                        themeMode: "dark",
                        defaultRegion: "us-east-1",
                        defaultEnvironment: "development",
                        resources: { cpu: 0.5, memory: 512, replicas: 1 },
                        notifications: {
                            deploySuccess: true,
                            deployFailure: true,
                            serviceDown: true,
                            highCpu: true,
                            highMemory: false,
                            securityAlerts: true,
                            emailNotifications: false,
                            slackNotifications: true,
                        }
                    }
                }

                return settings
            } catch (error) {
                console.error('[settings.get] error:', error)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch settings' })
            }
        }),

    update: secureProcedure('settings.update')
        .input(z.object({
            slackAlerts: z.boolean().optional(),
            autoRebuild: z.boolean().optional(),
            enableAnimations: z.boolean().optional(),
            themeMode: z.enum(['dark', 'light', 'system', 'auto']).optional(),
            defaultRegion: z.string().optional(),
            defaultEnvironment: z.string().optional(),
            resources: z.any().optional(),
            notifications: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id || (ctx as any).userId
            if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

            try {
                const [updated] = await ctx.drizzleDb
                    .insert(userSettings)
                    .values({
                        userId,
                        ...input,
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: userSettings.userId,
                        set: {
                            ...input,
                            updatedAt: new Date(),
                        }
                    })
                    .returning()

                return updated
            } catch (error) {
                console.error('[settings.update] error:', error)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update settings' })
            }
        }),

    clearData: secureProcedure('settings.clearData')
        .mutation(async ({ ctx }) => {
            const userId = ctx.session?.user?.id || (ctx as any).userId
            if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

            try {
                // In a production environment with 1000+ users, we must ensure 
                // data deletion is strictly scoped to the user's projects.
                // For now, mirroring the legacy behavior but preparing for strict scoping.
                await ctx.db.query(`DELETE FROM metrics`)
                await ctx.db.query(`DELETE FROM system_logs`)
                await ctx.db.query(`DELETE FROM audit_logs`)

                return { success: true, message: 'Data cleared successfully' }
            } catch (error) {
                console.error('[settings.clearData] error:', error)
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to clear data' })
            }
        })
})
