"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Box, Layers, ShieldCheck, ShieldAlert, HardDrive, Shield, Globe, BarChart3, Lock, Database, Activity, Terminal } from "lucide-react"

// ────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────────

export const PROVIDER_COLORS: Record<string, string> = {
  // Compute & Apps
  vercel: 'bg-white/15 text-white border-white/20',
  netlify: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  cloudflare: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  render: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  railway: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fly: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  heroku: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
  digitalocean: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  // Cloud Providers
  aws: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  gcp: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  azure: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  // Infrastructure
  kubernetes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  terraform: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
  docker: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
  // Databases
  neon: 'bg-green-400/20 text-green-300 border-green-400/30',
  supabase: 'bg-green-500/20 text-green-400 border-green-500/30',
  planetscale: 'bg-neutral-400/20 text-neutral-300 border-neutral-400/30',
  turso: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  mongodb: 'bg-green-600/20 text-green-400 border-green-600/30',
  cockroach: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
  fauna: 'bg-purple-600/20 text-purple-300 border-purple-600/30',
  clickhouse: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  // Cache & Messaging
  upstash: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  pusher: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  rabbitmq: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  confluent: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  // Email & Comms
  resend: 'bg-neutral-300/20 text-neutral-200 border-neutral-300/30',
  sendgrid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  twilio: 'bg-red-500/20 text-red-400 border-red-500/30',
  // Monitoring & Security
  posthog: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  sentry: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  datadog: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  newrelic: 'bg-green-500/20 text-green-400 border-green-500/30',
  betterstack: 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
  axiom: 'bg-violet-400/20 text-violet-300 border-violet-400/30',
  doppler: 'bg-neutral-400/20 text-neutral-300 border-neutral-400/30',
  auth0: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  clerk: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  // Storage
  backblaze: 'bg-red-400/20 text-red-300 border-red-400/30',
  // AI & ML
  openai: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  replicate: 'bg-neutral-400/20 text-neutral-300 border-neutral-400/30',
  huggingface: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pinecone: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  weaviate: 'bg-green-400/20 text-green-300 border-green-400/30',
  // Search & Discovery
  algolia: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meilisearch: 'bg-pink-400/20 text-pink-300 border-pink-400/30',
  elastic: 'bg-teal-400/20 text-teal-300 border-teal-400/30',
  // CDN & Networking
  fastly: 'bg-red-500/20 text-red-400 border-red-500/30',
  akamai: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  // DevOps & CI/CD
  github: 'bg-neutral-400/20 text-neutral-300 border-neutral-400/30',
  gitlab: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  circleci: 'bg-green-400/20 text-green-300 border-green-400/30',
  // CMS & Content
  contentful: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  strapi: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
  sanity: 'bg-red-400/20 text-red-300 border-red-400/30',
  // Data & Analytics
  segment: 'bg-green-500/20 text-green-400 border-green-500/30',
  // FinTech & Payments
  stripe: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  paypal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  alchemy: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  // Fallback
  local: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

export const LEVEL_STYLES: Record<string, string> = {
  error: 'text-red-400 bg-red-500/10',
  critical: 'text-red-500 bg-red-500/15',
  fatal: 'text-red-500 bg-red-500/15',
  warn: 'text-amber-400 bg-amber-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  info: 'text-blue-400 bg-blue-500/10',
  debug: 'text-zinc-400 bg-zinc-500/10',
}

// ────────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ────────────────────────────────────────────────────────────────────────────────

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm", className)}>
    {children}
  </div>
)

export const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-muted/30">
    <Icon className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">{subtitle}</p>}
  </div>
)

export const SectionHeader = ({ title, icon: Icon, action }: { title: string; icon: any; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {title}
    </h3>
    {action}
  </div>
)
