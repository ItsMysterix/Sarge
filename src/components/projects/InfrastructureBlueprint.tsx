"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe, Database, Zap, Shield, Activity, Cpu, Layers,
  CheckCircle2, AlertTriangle, Server, Cloud, Brain,
  Search, Sparkles, Rocket, SearchCode, Container,
  Flame, HardDrive, Eye, Key, Boxes, Workflow, BarChart3,
  Network, MessageSquare, Lock, Route, Share2, Table,
  ArrowRight, ShieldCheck, LogIn, Loader2, Smile, Mail,
  Radio, ShieldAlert, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// --- Types ---
export type InfrastructureGroup =
  | 'Compute & Apps' | 'Databases' | 'Storage' | 'AI & Machine Learning'
  | 'Monitoring & Security' | 'Networking & CDN' | 'Messaging & Integration'
  | 'Search & Discovery' | 'DevOps & Automation' | 'CMS & Content' | 'FinTech & Payments'

export interface ServiceOption {
  id: string
  name: string
  group: InfrastructureGroup
  type: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  provider: string
}

const ALL_SERVICES: ServiceOption[] = [
  // --- Compute & Apps ---
  { id: 'aws-lambda', name: 'AWS Lambda', group: 'Compute & Apps', type: 'Serverless', icon: Zap, description: 'Run code without thinking about servers.', provider: 'aws' },
  { id: 'aws-fargate', name: 'AWS Fargate', group: 'Compute & Apps', type: 'Container', icon: Container, description: 'Serverless compute for containers.', provider: 'aws' },
  { id: 'aws-app-runner', name: 'AWS App Runner', group: 'Compute & Apps', type: 'PaaS', icon: Rocket, description: 'Direct from source to serverless node.', provider: 'aws' },
  { id: 'gcp-cloud-run', name: 'GCP Cloud Run', group: 'Compute & Apps', type: 'Container', icon: Ship, description: 'Deploy containerized apps in seconds.', provider: 'gcp' },
  { id: 'gcp-app-engine', name: 'GCP App Engine', group: 'Compute & Apps', type: 'PaaS', icon: Globe, description: 'Managed platform for web applications.', provider: 'gcp' },
  { id: 'azure-functions', name: 'Azure Functions', group: 'Compute & Apps', type: 'Serverless', icon: Workflow, description: 'Event-driven serverless compute.', provider: 'azure' },
  { id: 'vercel-nextjs', name: 'Vercel Next.js', group: 'Compute & Apps', type: 'Frontend', icon: Globe, description: 'The native Next.js deployment experience.', provider: 'vercel' },
  { id: 'netlify-frontend', name: 'Netlify Edge', group: 'Compute & Apps', type: 'Frontend', icon: Layers, description: 'The platform for modern web projects.', provider: 'netlify' },
  { id: 'cloudflare-workers', name: 'Cloudflare Workers', group: 'Compute & Apps', type: 'Edge Compute', icon: Zap, description: 'Deploy serverless code instantly.', provider: 'cloudflare' },
  { id: 'render-service', name: 'Render Web Service', group: 'Compute & Apps', type: 'PaaS', icon: Server, description: 'The easiest way to host any app.', provider: 'render' },
  { id: 'railway-service', name: 'Railway App', group: 'Compute & Apps', type: 'PaaS', icon: Zap, description: 'Deploy infrastructure without pain.', provider: 'railway' },
  { id: 'fly-machines', name: 'Fly.io Machines', group: 'Compute & Apps', type: 'Micro-VM', icon: Cpu, description: 'Compute near your users.', provider: 'fly' },
  { id: 'heroku-dyno', name: 'Heroku Dynos', group: 'Compute & Apps', type: 'PaaS', icon: Layers, description: 'The gold standard for app hosting.', provider: 'heroku' },
  { id: 'digitalocean-app', name: 'DO App Platform', group: 'Compute & Apps', type: 'PaaS', icon: Globe, description: 'Managed solution for apps.', provider: 'digitalocean' },

  // --- Databases ---
  { id: 'aws-rds', name: 'AWS RDS (PostgreSQL)', group: 'Databases', type: 'Relational', icon: Database, description: 'Managed SQL database clusters.', provider: 'aws' },
  { id: 'aws-dynamodb', name: 'AWS DynamoDB', group: 'Databases', type: 'NoSQL', icon: Table, description: 'Fast and flexible NoSQL database.', provider: 'aws' },
  { id: 'gcp-cloud-sql', name: 'GCP Cloud SQL', group: 'Databases', type: 'Relational', icon: Database, description: 'Managed MySQL and PostgreSQL.', provider: 'gcp' },
  { id: 'neon-db', name: 'Neon Serverless', group: 'Databases', type: 'PostgreSQL', icon: Zap, description: 'Serverless Postgres with branching.', provider: 'neon' },
  { id: 'planetscale-db', name: 'PlanetScale', group: 'Databases', type: 'MySQL', icon: HardDrive, description: 'Serverless database with branching.', provider: 'planetscale' },
  { id: 'supabase-db', name: 'Supabase DB', group: 'Databases', type: 'PostgreSQL', icon: Flame, description: 'The open source Firebase alternative.', provider: 'supabase' },
  { id: 'turso-db', name: 'Turso Edge SQLite', group: 'Databases', type: 'SQLite', icon: Network, description: 'The SQLite for the edge.', provider: 'turso' },
  { id: 'mongodb-atlas', name: 'MongoDB Atlas', group: 'Databases', type: 'Document', icon: Share2, description: 'Fully managed multi-cloud database.', provider: 'mongodb' },
  { id: 'azure-cosmos', name: 'Azure Cosmos DB', group: 'Databases', type: 'NoSQL', icon: Globe, description: 'Distributed multi-model DB.', provider: 'azure' },
  { id: 'cockroach-db', name: 'CockroachDB Dedicated', group: 'Databases', type: 'SQL', icon: Shield, description: 'Resilient, distributed SQL database.', provider: 'cockroach' },
  { id: 'fauna-db', name: 'Fauna Serverless', group: 'Databases', type: 'NoSQL', icon: Boxes, description: 'The database that scales like a PaaS.', provider: 'fauna' },
  { id: 'clickhouse-cloud', name: 'ClickHouse Cloud', group: 'Databases', type: 'Analytics', icon: BarChart3, description: 'Fast OLAP database.', provider: 'clickhouse' },

  // --- Storage ---
  { id: 'aws-s3', name: 'AWS S3', group: 'Storage', type: 'Object Storage', icon: HardDrive, description: 'Scalable storage in the cloud.', provider: 'aws' },
  { id: 'gcp-storage', name: 'GCP Cloud Storage', group: 'Storage', type: 'Object Storage', icon: HardDrive, description: 'Reliable world-wide object storage.', provider: 'gcp' },
  { id: 'azure-blob', name: 'Azure Blob Storage', group: 'Storage', type: 'Object Storage', icon: Cloud, description: 'Massively scalable object storage.', provider: 'azure' },
  { id: 'cloudflare-r2', name: 'Cloudflare R2', group: 'Storage', type: 'Object Storage', icon: Zap, description: 'Egress-free object storage.', provider: 'cloudflare' },
  { id: 'vercel-blob', name: 'Vercel Blob', group: 'Storage', type: 'Object Storage', icon: Cloud, description: 'Fast, secure object storage for the edge.', provider: 'vercel' },
  { id: 'supabase-storage', name: 'Supabase Storage', group: 'Storage', type: 'Object Storage', icon: Layers, description: 'Manage large files with ease.', provider: 'supabase' },
  { id: 'backblaze-b2', name: 'Backblaze B2', group: 'Storage', type: 'Object Storage', icon: HardDrive, description: 'Cloud storage with enterprise reliability.', provider: 'backblaze' },

  // --- AI & Machine Learning ---
  { id: 'openai-api', name: 'OpenAI Enterprise', group: 'AI & Machine Learning', type: 'LLM API', icon: Brain, description: 'Access GPT-4o and advanced models.', provider: 'openai' },
  { id: 'aws-sagemaker', name: 'AWS SageMaker', group: 'AI & Machine Learning', type: 'ML Platform', icon: Brain, description: 'Build, train, and deploy ML models.', provider: 'aws' },
  { id: 'gcp-vertex', name: 'GCP Vertex AI', group: 'AI & Machine Learning', type: 'ML Platform', icon: Sparkles, description: 'Unified AI platform for Google Cloud.', provider: 'gcp' },
  { id: 'azure-ml', name: 'Azure AI Service', group: 'AI & Machine Learning', type: 'Cognitive', icon: Brain, description: 'Pre-built AI for applications.', provider: 'azure' },
  { id: 'replicate-ai', name: 'Replicate Serverless', group: 'AI & Machine Learning', type: 'Serverless AI', icon: Zap, description: 'Run open-source models at scale.', provider: 'replicate' },
  { id: 'huggingface-endpoints', name: 'Hugging Face Inf', group: 'AI & Machine Learning', type: 'Inference', icon: Smile, description: 'Deploy NLP models to production.', provider: 'huggingface' },
  { id: 'pinecone-db', name: 'Pinecone Vector DB', group: 'AI & Machine Learning', type: 'Vector Search', icon: SearchCode, description: 'Vector database for RAG apps.', provider: 'pinecone' },
  { id: 'weaviate-cloud', name: 'Weaviate Cloud', group: 'AI & Machine Learning', type: 'Vector DB', icon: Boxes, description: 'Open-source vector database.', provider: 'weaviate' },
  { id: 'upstash-vector', name: 'Upstash Vector', group: 'AI & Machine Learning', type: 'Serverless Vector', icon: Zap, description: 'Serverless vector DB for edge apps.', provider: 'upstash' },

  // --- Monitoring & Security ---
  { id: 'auth0', name: 'Auth0 by Okta', group: 'Monitoring & Security', type: 'Identity', icon: ShieldCheck, description: 'Secure access for every application.', provider: 'auth0' },
  { id: 'clerk-auth', name: 'Clerk Authentication', group: 'Monitoring & Security', type: 'Auth', icon: Key, description: 'Complete user management & auth.', provider: 'clerk' },
  { id: 'sentry-error', name: 'Sentry Error Track', group: 'Monitoring & Security', type: 'Observability', icon: ShieldAlert, description: 'Real-time error tracking and insight.', provider: 'sentry' },
  { id: 'new-relic', name: 'New Relic APM', group: 'Monitoring & Security', type: 'Performance', icon: Activity, description: 'Full-stack observability platform.', provider: 'newrelic' },
  { id: 'posthog-os', name: 'PostHog Product OS', group: 'Monitoring & Security', type: 'Analytics', icon: BarChart3, description: 'Everything you need to build better products.', provider: 'posthog' },
  { id: 'doppler-secrets', name: 'Doppler Secret Ops', group: 'Monitoring & Security', type: 'Security', icon: Lock, description: 'Sync secrets across your infrastructure.', provider: 'doppler' },
  { id: 'betterstack', name: 'Better Stack', group: 'Monitoring & Security', type: 'Uptime', icon: Activity, description: 'Uptime, logs, and incident management.', provider: 'betterstack' },
  { id: 'axiom-logs', name: 'Axiom Logging', group: 'Monitoring & Security', type: 'Logs', icon: HardDrive, description: 'Serverless logging and analytics.', provider: 'axiom' },
  { id: 'datadog-agent', name: 'Datadog Agent', group: 'Monitoring & Security', type: 'Observability', icon: Eye, description: 'Enterprise monitoring and security.', provider: 'datadog' },

  // --- Networking & CDN ---
  { id: 'cloudflare-cdn', name: 'Cloudflare CDN', group: 'Networking & CDN', type: 'Edge Network', icon: Route, description: 'Global content delivery network.', provider: 'cloudflare' },
  { id: 'aws-cloudfront', name: 'AWS CloudFront', group: 'Networking & CDN', type: 'CDN', icon: Network, description: 'High-speed content delivery.', provider: 'aws' },
  { id: 'gcp-cdn', name: 'GCP Cloud CDN', group: 'Networking & CDN', type: 'CDN', icon: Globe, description: 'Google-scale content delivery.', provider: 'gcp' },
  { id: 'azure-frontdoor', name: 'Azure Front Door', group: 'Networking & CDN', type: 'Edge', icon: ShieldCheck, description: 'Modern cloud CDN with security.', provider: 'azure' },
  { id: 'fastly-edge', name: 'Fastly Edge', group: 'Networking & CDN', type: 'Edge', icon: Activity, description: 'Real-time edge cloud platform.', provider: 'fastly' },
  { id: 'akamai-cdn', name: 'Akamai CDN', group: 'Networking & CDN', type: 'CDN', icon: Network, description: 'Professional content delivery.', provider: 'akamai' },

  // --- Messaging & Integration ---
  { id: 'upstash-redis', name: 'Upstash Redis', group: 'Messaging & Integration', type: 'Cache', icon: Zap, description: 'Serverless Redis at the edge.', provider: 'upstash' },
  { id: 'resend-email', name: 'Resend API', group: 'Messaging & Integration', type: 'Email', icon: Mail, description: 'The best way to send emails.', provider: 'resend' },
  { id: 'sendgrid-email', name: 'SendGrid Email', group: 'Messaging & Integration', type: 'Email', icon: Mail, description: 'The world leader in transactional email.', provider: 'sendgrid' },
  { id: 'pusher-realtime', name: 'Pusher Channels', group: 'Messaging & Integration', type: 'Real-time', icon: Radio, description: 'Build scalable real-time features.', provider: 'pusher' },
  { id: 'twilio-sms', name: 'Twilio SMS & Voice', group: 'Messaging & Integration', type: 'Comms', icon: MessageSquare, description: 'Programmable communication APIs.', provider: 'twilio' },
  { id: 'aws-sqs', name: 'AWS SQS', group: 'Messaging & Integration', type: 'Queue', icon: Workflow, description: 'Fully managed message queuing.', provider: 'aws' },
  { id: 'gcp-pubsub', name: 'GCP Pub/Sub', group: 'Messaging & Integration', type: 'Messaging', icon: Share2, description: 'Global event bus and ingestion.', provider: 'gcp' },
  { id: 'rabbitmq-cloud', name: 'RabbitMQ (Cloud)', group: 'Messaging & Integration', type: 'AMQP', icon: Workflow, description: 'Fully managed RabbitMQ clusters.', provider: 'rabbitmq' },
  { id: 'confluent-kafka', name: 'Confluent Cloud', group: 'Messaging & Integration', type: 'Kafka', icon: Share2, description: 'Streaming data with Apache Kafka.', provider: 'confluent' },
  { id: 'segment-data', name: 'Segment CDP', group: 'Messaging & Integration', type: 'Data', icon: Layers, description: 'Customer data platform for developers.', provider: 'segment' },

  // --- Search & Discovery ---
  { id: 'algolia-search', name: 'Algolia', group: 'Search & Discovery', type: 'Search API', icon: Search, description: 'Fast, secure, and reliable search API.', provider: 'algolia' },
  { id: 'meilisearch-cloud', name: 'Meilisearch', group: 'Search & Discovery', type: 'Search Engine', icon: SearchCode, description: 'Lightning-fast, open-source search.', provider: 'meilisearch' },
  { id: 'elastic-cloud', name: 'Elastic Cloud', group: 'Search & Discovery', type: 'Search/Logs', icon: HardDrive, description: 'Managed Elasticsearch and Kibana.', provider: 'elastic' },

  // --- DevOps & Automation ---
  { id: 'github-actions', name: 'GitHub Actions', group: 'DevOps & Automation', type: 'CI/CD', icon: Workflow, description: 'Automate your software workflow.', provider: 'github' },
  { id: 'gitlab-ci', name: 'GitLab CI/CD', group: 'DevOps & Automation', type: 'CI/CD', icon: Rocket, description: 'Integrated CI/CD pipelines.', provider: 'gitlab' },
  { id: 'docker-hub', name: 'Docker Hub', group: 'DevOps & Automation', type: 'Registry', icon: Container, description: 'Managed container registry.', provider: 'docker' },
  { id: 'circle-ci', name: 'CircleCI', group: 'DevOps & Automation', type: 'CI/CD', icon: RefreshCw, description: 'Speed up your build and test cycles.', provider: 'circleci' },

  // --- CMS & Content ---
  { id: 'contentful-cms', name: 'Contentful', group: 'CMS & Content', type: 'Headless CMS', icon: Layers, description: 'Content infrastructure for digital teams.', provider: 'contentful' },
  { id: 'strapi-cloud', name: 'Strapi Cloud', group: 'CMS & Content', type: 'Headless CMS', icon: Boxes, description: 'Open-source Node.js headless CMS.', provider: 'strapi' },
  { id: 'sanity-io', name: 'Sanity', group: 'CMS & Content', type: 'Headless CMS', icon: Sparkles, description: 'Platform for structured content.', provider: 'sanity' },

  // --- FinTech & Payments ---
  { id: 'stripe-payments', name: 'Stripe', group: 'FinTech & Payments', type: 'Payments', icon: Activity, description: 'Financial infrastructure for the internet.', provider: 'stripe' },
  { id: 'paypal-auth', name: 'PayPal', group: 'FinTech & Payments', type: 'Payments', icon: CheckCircle2, description: 'Payment processing and checkout.', provider: 'paypal' },
  { id: 'alchemy-node', name: 'Alchemy', group: 'FinTech & Payments', type: 'Web3', icon: Zap, description: 'Web3 developer platform and nodes.', provider: 'alchemy' },
]

// --- Icons ---
function Ship(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.2.9 4.5 2.1 6" />
      <path d="M12 10V2" />
      <path d="M12 2 8 6" />
      <path d="M12 2l4 4" />
    </svg>
  )
}

// --- Internal Components ---

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  activeProvider,
  setActiveProvider,
  allProviders
}: {
  searchTerm: string,
  setSearchTerm: (s: string) => void,
  activeProvider: string,
  setActiveProvider: (s: string) => void,
  allProviders: string[]
}) => (
  <div className="w-full flex flex-col md:flex-row gap-4 p-1.5 bg-card/20 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl">
    <label className="relative flex-1 group">
      <span className="sr-only">Search infrastructure components</span>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-all" aria-hidden="true" />
      <input
        type="text"
        placeholder="Search components (e.g. S3, Lambda, Vertex)..."
        className="w-full bg-transparent pl-11 pr-4 py-3 text-[11px] focus:ring-0 outline-none placeholder:text-muted-foreground/30 font-medium"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </label>
    <div className="flex bg-background/30 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-1" role="group" aria-label="Filter by provider">
      {allProviders.map(p => (
        <button
          key={p}
          onClick={() => setActiveProvider(p)}
          aria-pressed={activeProvider === p}
          className={cn(
            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
            activeProvider === p ? "bg-foreground text-background shadow-lg" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  </div>
)

const ServiceCard = ({
  service, selected, onToggle, connected, isRecommended, onConnect
}: {
  service: ServiceOption, selected: boolean, onToggle: () => void, connected: boolean, isRecommended?: boolean, onConnect: () => void
}) => {
  const Icon = service.icon
  return (
    <motion.div
      layout
      onClick={onToggle}
      className={cn(
        "relative p-4 rounded-[28px] border transition-all cursor-pointer group flex items-center gap-4",
        selected
          ? "bg-foreground/5 border-foreground/30 shadow-md"
          : "bg-card/20 border-white/5 hover:border-white/10 hover:bg-card/40"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
        selected ? "bg-foreground text-background" : "bg-muted/30 text-muted-foreground group-hover:scale-105"
      )}>
         <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <h3 className="font-black text-[11px] uppercase tracking-tight text-foreground truncate">
             {service.name}
           </h3>
           {isRecommended && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" title="AI Recommended" />}
        </div>
        <p className="text-[9px] text-muted-foreground leading-tight truncate opacity-50">
          {service.description}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
         {selected && (
            <div className={cn(
              "px-1.5 py-0.5 rounded-full flex items-center gap-1",
              connected ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500 text-white"
            )}>
               {connected ? <CheckCircle2 className="w-2 h-2" /> : <AlertTriangle className="w-2 h-2" />}
               <span className="text-[7px] font-black uppercase tracking-widest">{connected ? "OK" : "Link"}</span>
            </div>
         )}
         {!selected && isRecommended && (
            <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full text-[7px] font-black uppercase">PREF</div>
         )}
      </div>
    </motion.div>
  )
}

const SelectionBar = ({
  selectedServices, serviceMap, isConnected, onConnectProvider, onNext
}: {
  selectedServices: string[], serviceMap: Record<string, ServiceOption>, isConnected: (p: string) => boolean, onConnectProvider: (p: string) => void, onNext: () => void
}) => (
  <AnimatePresence>
    {selectedServices.length > 0 && (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
      >
        <div className="bg-foreground text-background p-4 px-6 rounded-[32px] shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {selectedServices.slice(0, 5).map(id => {
                const s = serviceMap[id]
                return s && (
                  <div key={id} className="w-10 h-10 rounded-xl bg-background border-2 border-foreground flex items-center justify-center text-foreground shadow-lg">
                     <s.icon className="w-5 h-5" />
                  </div>
                )
              })}
              {selectedServices.length > 5 && (
                 <div className="w-10 h-10 rounded-xl bg-muted border-2 border-foreground flex items-center justify-center text-foreground font-black text-[10px]">
                   +{selectedServices.length - 5}
                 </div>
              )}
            </div>
            <div className="hidden sm:block">
               <p className="text-sm font-black italic tracking-tighter">{selectedServices.length} Selected Nodes</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedServices.some(id => !isConnected(serviceMap[id]?.provider || '')) && (
              <Button
                onClick={() => {
                  const firstUnlinkedId = selectedServices.find(id => !isConnected(serviceMap[id]?.provider || ''))
                  const provider = serviceMap[firstUnlinkedId || '']?.provider
                  if (provider) onConnectProvider(provider)
                }}
                variant="ghost"
                className="h-10 px-4 text-background/60 hover:text-background font-black uppercase text-[8px] tracking-widest rounded-xl transition-all flex items-center gap-2"
              >
                <Key className="w-3 h-3" /> Bridge All
              </Button>
            )}
            <Button onClick={onNext} className="h-10 px-6 bg-background text-foreground hover:bg-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-2 group">
              Assembly <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// --- Exported Component ---

interface InfrastructureBlueprintProps {
  selectedServices: string[]
  setSelectedServices: React.Dispatch<React.SetStateAction<string[]>>
  aiRecommended?: string[]
  onConnectProvider: (providerId: string) => void
  isConnected: (providerId: string) => boolean
  onNext: () => void
}

export function InfrastructureBlueprint({
  selectedServices,
  setSelectedServices,
  aiRecommended = [],
  onConnectProvider,
  isConnected,
  onNext
}: InfrastructureBlueprintProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeProvider, setActiveProvider] = useState<string>('all')

  const serviceMap = useMemo(() =>
    Object.fromEntries(ALL_SERVICES.map(s => [s.id, s])),
    []
  )

  const allProviders = useMemo(() => {
    const list = Array.from(new Set(ALL_SERVICES.map(s => s.provider))).sort()
    return ['all', ...list]
  }, [])

  const { recommended, remaining } = useMemo(() => {
    const filtered = ALL_SERVICES.filter(svc => {
      const matchProvider = activeProvider === 'all' || svc.provider === activeProvider
      const matchSearch = svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          svc.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchProvider && matchSearch
    })

    return {
      recommended: filtered.filter(s => aiRecommended.includes(s.id)),
      remaining: filtered.filter(s => !aiRecommended.includes(s.id))
    }
  }, [activeProvider, searchTerm, aiRecommended])

  const handleToggle = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeProvider={activeProvider}
        setActiveProvider={setActiveProvider}
        allProviders={allProviders}
      />

      <div className="space-y-12">
        {/* Recommended Intelligent Options */}
        {recommended.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="h-[1px] bg-indigo-500/20 flex-1" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 italic flex items-center gap-2">
                 <Sparkles className="w-3 h-3" /> Intelligent Blueprint Recommendations
               </h2>
               <div className="h-[1px] bg-indigo-500/20 flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {recommended.map(svc => (
                 <ServiceCard
                    key={svc.id}
                    service={svc}
                    selected={selectedServices.includes(svc.id)}
                    onToggle={() => handleToggle(svc.id)}
                    connected={isConnected(svc.provider)}
                    isRecommended={true}
                    onConnect={() => onConnectProvider(svc.provider)}
                 />
              ))}
            </div>
          </div>
        )}

        {/* Remaining Marketplace */}
        {remaining.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="h-[1px] bg-white/5 flex-1" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">
                 Full Marketplace / Optional Nodes
               </h2>
               <div className="h-[1px] bg-white/5 flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {remaining.map(svc => (
                 <ServiceCard
                    key={svc.id}
                    service={svc}
                    selected={selectedServices.includes(svc.id)}
                    onToggle={() => handleToggle(svc.id)}
                    connected={isConnected(svc.provider)}
                    onConnect={() => onConnectProvider(svc.provider)}
                 />
              ))}
            </div>
          </div>
        )}

        {recommended.length === 0 && remaining.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <Boxes className="w-8 h-8 text-muted-foreground/20 mx-auto" />
             <p className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">No matching modular nodes found.</p>
          </div>
        )}
      </div>

      <SelectionBar
        selectedServices={selectedServices}
        serviceMap={serviceMap}
        isConnected={isConnected}
        onConnectProvider={onConnectProvider}
        onNext={onNext}
      />
    </div>
  )
}
