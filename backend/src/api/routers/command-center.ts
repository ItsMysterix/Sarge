import { router } from "../../trpc";
import { secureProcedure } from "../trpc/middlewares/security";
import { z } from "zod";
import { getProvider } from "../lib/providers";
import { eq, and } from "drizzle-orm";
import { connectedProviders } from "../lib/drizzle-schema";
import { TRPCError } from "@trpc/server";

export const commandCenterRouter = router({
    /**
     * Discovers all resources across all connected cloud accounts.
     */
    getInventory: secureProcedure('commandCenter.getInventory')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb
                .select()
                .from(connectedProviders)
                .where(eq(connectedProviders.projectSlug, slug))

            const allResources: any[] = []

            for (const row of connected) {
                if (row.status !== 'connected' || !row.credentials) continue

                const provider = getProvider(row.providerId)
                if (provider && provider.discoverResources) {
                    try {
                        const resources = await provider.discoverResources({
                            credentials: row.credentials as Record<string, string>
                        })
                        allResources.push(...resources.map(r => ({
                            ...r,
                            providerId: row.providerId,
                            providerName: provider.name
                        })))
                    } catch (e) {
                        console.error(`[CommandCenter] Discovery failed for ${row.providerId}:`, e)
                    }
                }
            }

            return allResources
        }),

    /**
     * Fetches security findings and guardrail alerts across all providers.
     */
    getSecurityAlerts: secureProcedure('commandCenter.getSecurityAlerts')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb
                .select()
                .from(connectedProviders)
                .where(eq(connectedProviders.projectSlug, slug))

            const allAlerts: any[] = []

            for (const row of connected) {
                if (row.status !== 'connected' || !row.credentials) continue

                const provider = getProvider(row.providerId)
                if (provider && provider.getSecurityAlerts) {
                    try {
                        const alerts = await provider.getSecurityAlerts({
                            credentials: row.credentials as Record<string, string>
                        })
                        allAlerts.push(...alerts.map(a => ({
                            ...a,
                            providerId: row.providerId,
                            providerName: provider.name
                        })))
                    } catch (e) {
                        console.error(`[CommandCenter] Security fetch failed for ${row.providerId}:`, e)
                    }
                }
            }

            return allAlerts
        }),

    /**
     * Fetches account-wide activity logs (audit trail).
     */
    getAuditLogs: secureProcedure('commandCenter.getAuditLogs')
        .input(z.object({ projectSlug: z.string().optional(), limit: z.number().optional().default(50) }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb
                .select()
                .from(connectedProviders)
                .where(eq(connectedProviders.projectSlug, slug))

            const allLogs: any[] = []

            for (const row of connected) {
                if (row.status !== 'connected' || !row.credentials) continue

                const provider = getProvider(row.providerId)
                if (provider && provider.getAuditLogs) {
                    try {
                        const logs = await provider.getAuditLogs({
                            credentials: row.credentials as Record<string, string>,
                            limit: input?.limit
                        })
                        allLogs.push(...logs.map(l => ({
                            ...l,
                            providerId: row.providerId,
                            providerName: provider.name
                        })))
                    } catch (e) {
                        console.error(`[CommandCenter] Audit fetch failed for ${row.providerId}:`, e)
                    }
                }
            }

            return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        }),

    /**
   * Fetches account-wide metrics for a specific discovered resource.
   */
    getResourceMetrics: secureProcedure('commandCenter.getResourceMetrics')
        .input(z.object({
            providerId: z.string(),
            resourceId: z.string(),
            timeRange: z.string().optional().default('1h'),
            projectSlug: z.string().optional()
        }))
        .query(async ({ ctx, input }) => {
            const slug = input.projectSlug || 'global'
            const [row] = await ctx.drizzleDb
                .select()
                .from(connectedProviders)
                .where(and(eq(connectedProviders.projectSlug, slug), eq(connectedProviders.providerId, input.providerId)))
                .limit(1)

            if (!row || !row.credentials) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Provider credentials not found' })
            }

            const provider = getProvider(input.providerId)
            if (!provider || !provider.getAccountMetrics) {
                throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Metrics not supported for this provider' })
            }

            return provider.getAccountMetrics({
                credentials: row.credentials as Record<string, string>,
                resourceId: input.resourceId,
                timeRange: input.timeRange
            })
        }),

    getDomains: secureProcedure('commandCenter.getDomains')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb.select().from(connectedProviders).where(eq(connectedProviders.projectSlug, slug))
            const results: any[] = []
            for (const row of connected) {
                const provider = getProvider(row.providerId)
                if (provider?.getDomains && row.credentials) {
                    try {
                        const data = await provider.getDomains({ credentials: row.credentials as Record<string, string> })
                        results.push(...data.map(d => ({ ...d, providerId: row.providerId })))
                    } catch (e) { console.error(e) }
                }
            }
            return results
        }),

    getStorage: secureProcedure('commandCenter.getStorage')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb.select().from(connectedProviders).where(eq(connectedProviders.projectSlug, slug))
            const results: any[] = []
            for (const row of connected) {
                const provider = getProvider(row.providerId)
                if (provider?.getStorage && row.credentials) {
                    try {
                        const data = await provider.getStorage({ credentials: row.credentials as Record<string, string> })
                        results.push(...data.map(d => ({ ...d, providerId: row.providerId })))
                    } catch (e) { console.error(e) }
                }
            }
            return results
        }),

    getFirewall: secureProcedure('commandCenter.getFirewall')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb.select().from(connectedProviders).where(eq(connectedProviders.projectSlug, slug))
            const results: any[] = []
            for (const row of connected) {
                const provider = getProvider(row.providerId)
                if (provider?.getFirewall && row.credentials) {
                    try {
                        const data = await provider.getFirewall({ credentials: row.credentials as Record<string, string> })
                        results.push(...data.map(d => ({ ...d, providerId: row.providerId })))
                    } catch (e) { console.error(e) }
                }
            }
            return results
        }),

    getDetailedUsage: secureProcedure('commandCenter.getDetailedUsage')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb.select().from(connectedProviders).where(eq(connectedProviders.projectSlug, slug))
            const results: any[] = []
            for (const row of connected) {
                const provider = getProvider(row.providerId)
                if (provider?.getDetailedUsage && row.credentials) {
                    try {
                        const data = await provider.getDetailedUsage({ credentials: row.credentials as Record<string, string> })
                        results.push(...data.map(d => ({ ...d, providerId: row.providerId })))
                    } catch (e) { console.error(e) }
                }
            }
            return results
        }),

    getAnalytics: secureProcedure('commandCenter.getAnalytics')
        .input(z.object({ projectSlug: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            const slug = input?.projectSlug || 'global'
            const connected = await ctx.drizzleDb.select().from(connectedProviders).where(eq(connectedProviders.projectSlug, slug))
            const results: any[] = []
            for (const row of connected) {
                const provider = getProvider(row.providerId)
                if (provider?.getAnalytics && row.credentials) {
                    try {
                        const data = await provider.getAnalytics({ credentials: row.credentials as Record<string, string> })
                        results.push(...data.map(d => ({ ...d, providerId: row.providerId })))
                    } catch (e) { console.error(e) }
                }
            }
            return results
        })
})
