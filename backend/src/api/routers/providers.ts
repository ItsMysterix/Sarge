import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

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
  connectedAt?: string
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
        const result = await ctx.db.query(
          `SELECT provider_id as id, status, connected_at as "connectedAt" 
           FROM connected_providers 
           WHERE project_slug = $1`,
          [slug]
        ).catch(() => ({ rows: [] }))

        // Merge DB status with defaults
        return defaults.map(d => {
          const dbRow = result.rows.find((r: any) => r.id === d.id)
          return {
            ...d,
            status: dbRow?.status || 'disconnected',
            connectedAt: dbRow?.connectedAt
          }
        })
      } catch (e) {
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
      const connectedAt = status === 'connected' ? new Date().toISOString() : null

      try {
        await ctx.db.query(
          `INSERT INTO connected_providers (project_slug, provider_id, status, connected_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (project_slug, provider_id)
           DO UPDATE SET 
             status = EXCLUDED.status,
             connected_at = EXCLUDED.connected_at,
             updated_at = NOW()`,
          [slug, input.providerId, status, connectedAt]
        )
        return { id: input.providerId, status, connectedAt }
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update provider status' })
      }
    }),
})
