import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'

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

const store = new Map<string, ProviderRecord[]>()

const getKey = (projectSlug?: string | null) => projectSlug || 'global'

function getState(projectSlug?: string | null): ProviderRecord[] {
  const key = getKey(projectSlug)
  if (!store.has(key)) {
    // clone defaults
    store.set(key, defaults.map((d) => ({ ...d })))
  }
  return store.get(key) ?? []
}

export const providersRouter = router({
  list: secureProcedure('providers.list')
    .input(z.object({ projectSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getState(input?.projectSlug)
    }),

  toggle: secureProcedure('providers.toggle')
    .input(z.object({
      providerId: z.string(),
      projectSlug: z.string().optional(),
      status: z.enum(['connected', 'disconnected']).optional(),
    }))
    .mutation(async ({ input }) => {
      const items = getState(input.projectSlug)
      const idx = items.findIndex((p) => p.id === input.providerId)
      if (idx === -1) {
        const fresh: ProviderRecord = { ...defaults.find((d) => d.id === input.providerId)! }
        fresh.status = input.status ?? 'connected'
        fresh.connectedAt = fresh.status === 'connected' ? new Date().toISOString() : undefined
        items.push(fresh)
        return fresh
      }
      const nextStatus = input.status ?? (items[idx].status === 'connected' ? 'disconnected' : 'connected')
      items[idx] = {
        ...items[idx],
        status: nextStatus,
        connectedAt: nextStatus === 'connected' ? new Date().toISOString() : undefined,
      }
      return items[idx]
    }),
})
