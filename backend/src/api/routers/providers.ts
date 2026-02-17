import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'
import { connectedProviders } from '../lib/drizzle-schema'

export type ProviderKind = 'containers' | 'functions' | 'static'
export type ProviderStatus = 'connected' | 'disconnected'

export interface ProviderRecord {
  id: string
  name: string
  kind: ProviderKind
  badge: string
  description: string
  costHint: string
  status: ProviderStatus
  connectedAt?: string | Date | null
}

const defaults: ProviderRecord[] = [
  { id: 'vercel', name: 'Vercel', kind: 'static', badge: 'Static/Edge', description: 'Next.js, React, serverless/edge', costHint: '$0 starter | pay-go edge', status: 'disconnected' },
  { id: 'railway', name: 'Railway', kind: 'containers', badge: 'Containers', description: 'Fast container deploys with add-ons', costHint: 'Hobby free tier; $5 base', status: 'disconnected' },
  { id: 'cloudflare', name: 'Cloudflare Pages', kind: 'static', badge: 'Static/Workers', description: 'Pages + Workers for edge functions', costHint: 'Generous free; $5 Workers paid', status: 'disconnected' },
  { id: 'github', name: 'GitHub Pages', kind: 'static', badge: 'Static', description: 'Static sites from your repo', costHint: 'Free with repo', status: 'disconnected' },
  { id: 'aws', name: 'AWS', kind: 'containers', badge: 'ECS/Lambda', description: 'ECS/Fargate, Lambda, S3', costHint: 'Pay-go; no always-free compute', status: 'disconnected' },
  { id: 'gcp', name: 'GCP', kind: 'containers', badge: 'Cloud Run', description: 'Cloud Run, GKE Autopilot', costHint: 'Cloud Run free tier; pay-go', status: 'disconnected' },
  { id: 'azure', name: 'Azure', kind: 'containers', badge: 'Container Apps', description: 'Container Apps, Functions', costHint: 'Billed per sec; limited free', status: 'disconnected' },
  { id: 'fly', name: 'Fly.io', kind: 'containers', badge: 'Containers', description: 'Global Anycast apps', costHint: 'Free alloc; $ credit required', status: 'disconnected' },
  { id: 'render', name: 'Render', kind: 'containers', badge: 'Containers', description: 'Apps, static, cron, DB', costHint: 'Starter $7+/mo; static free', status: 'disconnected' },
]

export const providersRouter = router({
  list: secureProcedure('providers.list')
    .input(z.object({ projectSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const slug = input?.projectSlug || 'global'
      try {
        const result = await ctx.drizzleDb
          .select({
            id: connectedProviders.providerId,
            status: connectedProviders.status,
            connectedAt: connectedProviders.connectedAt
          })
          .from(connectedProviders)
          .where(eq(connectedProviders.projectSlug, slug))

        // Merge DB status with defaults
        return defaults.map(d => {
          const dbRow = result.find((r: any) => r.id === d.id)
          return {
            ...d,
            status: (dbRow?.status as ProviderStatus) || 'disconnected',
            connectedAt: dbRow?.connectedAt
          }
        })
      } catch (e) {
        console.error('[providers.list] Drizzle error:', e)
        return defaults
      }
    }),

  toggle: secureProcedure('providers.toggle')
    .input(z.object({
      providerId: z.string(),
      projectSlug: z.string().optional(),
      status: z.enum(['connected', 'disconnected']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.projectSlug || 'global'
      const status = input.status || 'connected'
      const connectedAt = status === 'connected' ? new Date() : null

      try {
        await ctx.drizzleDb.insert(connectedProviders)
          .values({
            projectSlug: slug,
            providerId: input.providerId,
            status: status as 'connected' | 'disconnected',
            connectedAt: connectedAt,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [connectedProviders.projectSlug, connectedProviders.providerId],
            set: {
              status: status as 'connected' | 'disconnected',
              connectedAt: connectedAt,
              updatedAt: new Date()
            }
          })

        return { id: input.providerId, status, connectedAt: connectedAt?.toISOString() }
      } catch (e) {
        console.error('[providers.toggle] Drizzle error:', e)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update provider status' })
      }
    }),
})
