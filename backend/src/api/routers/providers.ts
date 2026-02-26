import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'
import { connectedProviders } from '../lib/drizzle-schema'
import { providerLogger } from '../../lib/logger'

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
  { id: 'netlify', name: 'Netlify', kind: 'static', badge: 'Static/Edge', description: 'Static sites and edge functions', costHint: 'Free starter; pay-go Pro', status: 'disconnected' },
  { id: 'railway', name: 'Railway', kind: 'containers', badge: 'Containers', description: 'Fast container deploys with add-ons', costHint: 'Hobby free tier; $5 base', status: 'disconnected' },
  { id: 'heroku', name: 'Heroku', kind: 'containers', badge: 'App Engine', description: 'PaaS for Ruby, Node, Python', costHint: '$5 eco tier starter', status: 'disconnected' },
  { id: 'digitalocean', name: 'DigitalOcean', kind: 'containers', badge: 'Containers', description: 'App Platform and Droplets', costHint: '$4+ starter; generous data', status: 'disconnected' },
  { id: 'cloudflare', name: 'Cloudflare Pages', kind: 'static', badge: 'Static/Workers', description: 'Pages + Workers for edge functions', costHint: 'Generous free; $5 Workers paid', status: 'disconnected' },
  { id: 'github', name: 'GitHub Pages', kind: 'static', badge: 'Static', description: 'Static sites from your repo', costHint: 'Free with repo', status: 'disconnected' },
  { id: 'aws', name: 'AWS', kind: 'containers', badge: 'ECS/Lambda', description: 'ECS/Fargate, Lambda, S3', costHint: 'Pay-go; no always-free compute', status: 'disconnected' },
  { id: 'gcp', name: 'GCP', kind: 'containers', badge: 'Cloud Run', description: 'Cloud Run, GKE Autopilot', costHint: 'Cloud Run free tier; pay-go', status: 'disconnected' },
  { id: 'azure', name: 'Azure', kind: 'containers', badge: 'Container Apps', description: 'Container Apps, Functions', costHint: 'Billed per sec; limited free', status: 'disconnected' },
  { id: 'fly', name: 'Fly.io', kind: 'containers', badge: 'Containers', description: 'Global Anycast apps', costHint: 'Free alloc; $ credit required', status: 'disconnected' },
  { id: 'render', name: 'Render', kind: 'containers', badge: 'Containers', description: 'Apps, static, cron, DB', costHint: 'Starter $7+/mo; static free', status: 'disconnected' },
  { id: 'supabase', name: 'Supabase', kind: 'static', badge: 'BaaS', description: 'Postgres, Auth, Edge Functions', costHint: 'Generous free; $25 Pro', status: 'disconnected' },
  { id: 'planetscale', name: 'PlanetScale', kind: 'static', badge: 'Database', description: 'Serverless MySQL platform', costHint: '$0 scale tier', status: 'disconnected' },
  { id: 'neon', name: 'Neon', kind: 'static', badge: 'SQL/Nexus', description: 'Serverless Postgres with branching', costHint: 'Free tier with 512MB RAM', status: 'disconnected' },
  { id: 'local', name: 'Localhost', kind: 'containers', badge: 'Development', description: 'Run and debug apps on your local machine', costHint: 'Free', status: 'disconnected' },
  { id: 'kubernetes', name: 'Kubernetes', kind: 'containers', badge: 'Orchestration', description: 'Standard K8s cluster (EKS/GKE/Self-host)', costHint: 'Varies by cloud', status: 'disconnected' },
  { id: 'docker', name: 'Docker', kind: 'containers', badge: 'Containers', description: 'Generic Docker Registry or Host', costHint: 'Varies', status: 'disconnected' },
  { id: 'terraform', name: 'Terraform', kind: 'static', badge: 'IaC', description: 'Orchestrate resources via HCL', costHint: 'Cloud managed free tier', status: 'disconnected' },
  { id: 'mongodb', name: 'MongoDB Atlas', kind: 'static', badge: 'Database', description: 'Multi-cloud document database', costHint: 'Free shared clusters', status: 'disconnected' },
  { id: 'upstash', name: 'Upstash', kind: 'static', badge: 'Serverless Data', description: 'Redis, Kafka, Vector at the edge', costHint: 'Pay-per-request', status: 'disconnected' },
  { id: 'pinecone', name: 'Pinecone', kind: 'static', badge: 'AI Database', description: 'Vector database for AI', costHint: 'Free starter plan', status: 'disconnected' },
  { id: 'datadog', name: 'Datadog', kind: 'static', badge: 'Observability', description: 'Monitoring and Security', costHint: 'Per-host billing', status: 'disconnected' },
  { id: 'turso', name: 'Turso', kind: 'static', badge: 'Edge SQL', description: 'SQLite for the edge', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'cockroach', name: 'CockroachDB', kind: 'static', badge: 'Distributed SQL', description: 'Resilient SQL', costHint: 'Free serverless tier', status: 'disconnected' },
  { id: 'fauna', name: 'Fauna', kind: 'static', badge: 'NoSQL', description: 'Serverless document-relational', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'clickhouse', name: 'ClickHouse', kind: 'static', badge: 'Analytics', description: 'Fast OLAP database', costHint: 'Cloud free trial', status: 'disconnected' },
  { id: 'backblaze', name: 'Backblaze B2', kind: 'static', badge: 'Storage', description: 'S3-compatible object storage', costHint: '$0 for first 10GB', status: 'disconnected' },
  { id: 'openai', name: 'OpenAI', kind: 'static', badge: 'AI', description: 'LLM APIs', costHint: 'Pay-as-you-go', status: 'disconnected' },
  { id: 'replicate', name: 'Replicate', kind: 'static', badge: 'AI', description: 'Serverless AI models', costHint: 'Pay-per-inference', status: 'disconnected' },
  { id: 'huggingface', name: 'Hugging Face', kind: 'static', badge: 'AI', description: 'Model inference', costHint: 'Free/Paid endpoints', status: 'disconnected' },
  { id: 'weaviate', name: 'Weaviate', kind: 'static', badge: 'Vector DB', description: 'Open-source vector search', costHint: 'Managed cloud tier', status: 'disconnected' },
  { id: 'resend', name: 'Resend', kind: 'static', badge: 'Email', description: 'Modern email API', costHint: '3k free/mo', status: 'disconnected' },
  { id: 'pusher', name: 'Pusher', kind: 'static', badge: 'Real-time', description: 'WebSocket infrastructure', costHint: 'Generous free tier', status: 'disconnected' },
  { id: 'sentry', name: 'Sentry', kind: 'static', badge: 'Observability', description: 'Error tracking', costHint: 'Free for developers', status: 'disconnected' },
  { id: 'newrelic', name: 'New Relic', kind: 'static', badge: 'Observability', description: 'Full-stack APM', costHint: '100GB/mo free', status: 'disconnected' },
  { id: 'posthog', name: 'PostHog', kind: 'static', badge: 'Product OS', description: 'Analytics & flags', costHint: '1M events free', status: 'disconnected' },
  { id: 'doppler', name: 'Doppler', kind: 'static', badge: 'Security', description: 'Secret management', costHint: 'Free for small teams', status: 'disconnected' },
  { id: 'betterstack', name: 'Better Stack', kind: 'static', badge: 'Observability', description: 'Uptime & Logs', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'axiom', name: 'Axiom', kind: 'static', badge: 'Observability', description: 'High-scale logging', costHint: 'Cloud free tier', status: 'disconnected' },
  { id: 'elastic', name: 'Elastic Search', kind: 'static', badge: 'Search/Logs', description: 'Managed ELK stack', costHint: 'Free trial; pay-go', status: 'disconnected' },
  { id: 'auth0', name: 'Auth0', kind: 'static', badge: 'Identity', description: 'Managed auth platform', costHint: '7.5k MAU free', status: 'disconnected' },
  { id: 'clerk', name: 'Clerk', kind: 'static', badge: 'Auth', description: 'User management', costHint: '10k MAU free', status: 'disconnected' },
  { id: 'stripe', name: 'Stripe', kind: 'static', badge: 'FinTech', description: 'Payment processing', costHint: 'Pay-per-transaction', status: 'disconnected' },
  { id: 'fastly', name: 'Fastly', kind: 'static', badge: 'Edge-Cloud', description: 'Edge compute & CDN', costHint: 'Hobby free / $50 min', status: 'disconnected' },
  { id: 'akamai', name: 'Akamai', kind: 'static', badge: 'CDN', description: 'Enterprise delivery', costHint: 'Enterprise pricing', status: 'disconnected' },
  { id: 'sendgrid', name: 'SendGrid', kind: 'static', badge: 'Email', description: 'Transactional email API', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'twilio', name: 'Twilio', kind: 'static', badge: 'Communications', description: 'SMS & Voice APIs', costHint: 'Pay-as-you-go', status: 'disconnected' },
  { id: 'rabbitmq', name: 'RabbitMQ', kind: 'static', badge: 'Messaging', description: 'Managed AMQP broker', costHint: 'Free multi-tenant plan', status: 'disconnected' },
  { id: 'confluent', name: 'Confluent', kind: 'static', badge: 'Streaming', description: 'Kafka as a service', costHint: '$0 starter tier', status: 'disconnected' },
  { id: 'segment', name: 'Segment', kind: 'static', badge: 'CDP', description: 'Customer data platform', costHint: '1k MTU free', status: 'disconnected' },
  { id: 'algolia', name: 'Algolia', kind: 'static', badge: 'Search', description: 'Search API platform', costHint: '10k requests free', status: 'disconnected' },
  { id: 'meilisearch', name: 'Meilisearch', kind: 'static', badge: 'Search', description: 'Cloud search engine', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'gitlab', name: 'GitLab', kind: 'static', badge: 'DevOps', description: 'CI/CD and Git platform', costHint: 'Free/Premium plans', status: 'disconnected' },
  { id: 'circleci', name: 'CircleCI', kind: 'static', badge: 'DevOps', description: 'Continuous integration', costHint: '6k mins free/mo', status: 'disconnected' },
  { id: 'contentful', name: 'Contentful', kind: 'static', badge: 'CMS', description: 'Headless content platform', costHint: 'Free for personal', status: 'disconnected' },
  { id: 'strapi', name: 'Strapi', kind: 'static', badge: 'CMS', description: 'Headless CMS', costHint: 'Self-host/Cloud', status: 'disconnected' },
  { id: 'sanity', name: 'Sanity', kind: 'static', badge: 'CMS', description: 'Structured content platform', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'paypal', name: 'PayPal', kind: 'static', badge: 'Payments', description: 'Merchant services', costHint: 'Transaction fees', status: 'disconnected' },
  { id: 'alchemy', name: 'Alchemy', kind: 'static', badge: 'Web3', description: 'Blockchain infrastructure', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'slack', name: 'Slack', kind: 'static', badge: 'Ops/Chat', description: 'Deploy notifications and ChatOps', costHint: 'Requires Slack Workspace', status: 'disconnected' },
  { id: 'discord', name: 'Discord', kind: 'static', badge: 'Ops/Chat', description: 'Discord Webhooks & Bots', costHint: 'Free', status: 'disconnected' },
  { id: 'notion', name: 'Notion', kind: 'static', badge: 'Docs', description: 'Internal syncs & changelogs', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'linear', name: 'Linear', kind: 'static', badge: 'PM', description: 'Issue tracking & sprint syncing', costHint: 'Free tier available', status: 'disconnected' },
  { id: 'jira', name: 'Jira', kind: 'static', badge: 'PM', description: 'Enterprise issue tracking', costHint: '10 users free', status: 'disconnected' },
  { id: 'asana', name: 'Asana', kind: 'static', badge: 'PM', description: 'Work tracking and metrics', costHint: 'Basic plan free', status: 'disconnected' },
  { id: 'hubspot', name: 'HubSpot', kind: 'static', badge: 'CRM', description: 'Marketing & Customer syncs', costHint: 'Free tools available', status: 'disconnected' },
  { id: 'salesforce', name: 'Salesforce', kind: 'static', badge: 'CRM', description: 'Enterprise CRM operations', costHint: 'Enterprise pricing', status: 'disconnected' },
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
        providerLogger.error({ e, input }, '[providers.list] Drizzle error')
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
            updatedAt: new Date(),
            credentials: status === 'disconnected' ? {} : undefined
          })
          .onConflictDoUpdate({
            target: [connectedProviders.projectSlug, connectedProviders.providerId],
            set: {
              status: status as 'connected' | 'disconnected',
              connectedAt: connectedAt,
              updatedAt: new Date(),
              ...(status === 'disconnected' ? { credentials: {} } : {})
            }
          })

        return { id: input.providerId, status, connectedAt: connectedAt?.toISOString() }
      } catch (e) {
        providerLogger.error({ e, input }, '[providers.toggle] Drizzle error')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update provider status' })
      }
    }),

  saveCredentials: secureProcedure('providers.saveCredentials')
    .input(z.object({
      providerId: z.string(),
      projectSlug: z.string().optional(),
      credentials: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.projectSlug || 'global'

      try {
        // Encrypt credentials before storing — never store plaintext tokens
        const { encryptCredentials } = await import('../lib/credentials')
        const encrypted = encryptCredentials(JSON.stringify(input.credentials))

        // Store encrypted blob in connected_providers (for UI status tracking)
        await ctx.drizzleDb.insert(connectedProviders)
          .values({
            projectSlug: slug,
            providerId: input.providerId,
            status: 'connected',
            credentials: { encrypted }, // Store encrypted blob, not raw tokens
            connectedAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [connectedProviders.projectSlug, connectedProviders.providerId],
            set: {
              status: 'connected',
              credentials: { encrypted },
              connectedAt: new Date(),
              updatedAt: new Date()
            }
          })

        // Also sync to provider_credentials table (used by getProviderCredentials at deploy time)
        const userId = (ctx as any).userId || null
        await ctx.db.query(
          `INSERT INTO provider_credentials (provider_id, user_id, credentials_encrypted, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (provider_id, user_id)
           DO UPDATE SET credentials_encrypted = $3, updated_at = NOW()`,
          [input.providerId, userId, encrypted]
        ).catch((err: any) => {
          // Table may not exist yet — connected_providers has the data as fallback
          if (!err?.message?.includes('provider_credentials')) throw err
          providerLogger.warn('[providers.saveCredentials] provider_credentials table not migrated yet')
        })

        providerLogger.info({ providerId: input.providerId }, '[providers.saveCredentials] Credentials saved (encrypted)')
        return { success: true, providerId: input.providerId }
      } catch (e) {
        providerLogger.error({ e, input: { providerId: input.providerId } }, '[providers.saveCredentials] Error')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save provider credentials' })
      }
    }),
})
