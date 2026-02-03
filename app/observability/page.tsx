"use client"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, Terminal, Gauge, ArrowUpRight, 
  TrendingUp, Server, Clock, AlertCircle 
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"

export default function ObservabilityPage() {
  const t = trpc as any
  const metricsQuery = t.metrics?.overview?.useQuery?.()
  
  const metrics = metricsQuery?.data || {
    cpu: 45,
    memory: 62,
    latency: 23,
    requests: 1250,
    errors: 3,
    uptime: 99.9
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Observability</h1>
          <p className="text-sm text-muted-foreground">Monitor performance, health, and logs</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard 
            label="CPU Usage" 
            value={`${metrics.cpu}%`} 
            icon={<Gauge className="w-4 h-4" />}
            status={metrics.cpu > 80 ? "warning" : "ok"}
          />
          <StatCard 
            label="Memory" 
            value={`${metrics.memory}%`} 
            icon={<Server className="w-4 h-4" />}
            status={metrics.memory > 85 ? "warning" : "ok"}
          />
          <StatCard 
            label="Avg Latency" 
            value={`${metrics.latency}ms`} 
            icon={<Clock className="w-4 h-4" />}
            status={metrics.latency > 100 ? "warning" : "ok"}
          />
          <StatCard 
            label="Uptime" 
            value={`${metrics.uptime}%`} 
            icon={<TrendingUp className="w-4 h-4" />}
            status="ok"
          />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Metrics */}
          <Link href="/metrics" className="glass-card p-6 group hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-violet-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Metrics</h2>
            <p className="text-sm text-muted-foreground mb-4">
              CPU, memory, latency, and service health charts with time range selection
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live refresh enabled
            </div>
          </Link>

          {/* Logs */}
          <Link href="/logs" className="glass-card p-6 group hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-blue-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Logs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Streaming logs with filters, bookmarks, and JSON/CSV export
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              5s live polling
            </div>
          </Link>

          {/* Services */}
          <Link href="/services" className="glass-card p-6 group hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Services</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Service health grades, uptime monitoring, and action controls
            </p>
            <div className="text-xs text-muted-foreground">
              Manage running services
            </div>
          </Link>

          {/* Alerts */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">Alerts</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure thresholds and receive notifications for critical events
            </p>
            <div className="text-xs text-muted-foreground">
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, icon, status }: {
  label: string
  value: string
  icon: React.ReactNode
  status: "ok" | "warning" | "error"
}) {
  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === "ok" && "bg-emerald-500",
          status === "warning" && "bg-amber-500",
          status === "error" && "bg-red-500"
        )} />
      </div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
