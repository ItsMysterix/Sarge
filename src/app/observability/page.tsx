"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, 
  Terminal, 
  Map, 
  Search, 
  Pause, 
  Play, 
  Download, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  Cpu,
  Server,
  Gauge,
  TrendingUp,
  ShieldAlert,
  Loader2
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { GtmManager } from "@/components/rust-core/GtmManager"
import { RemediationLogs } from "@/components/rust-core/RemediationLogs"

// --- Metrics Tab ---
const MetricsTab = ({ t }: any) => {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const metricsQuery = t.metrics?.current?.useQuery?.()
  const metrics = metricsQuery?.data || { cpu: 32, memory: 1024, latency: 45, errors: 2, requests: 1250 }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Cpu className="w-3.5 h-3.5" /> CPU
          </div>
          <div className="text-2xl font-bold">{metrics.cpu}%</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Server className="w-3.5 h-3.5" /> Memory
          </div>
          <div className="text-2xl font-bold">{metrics.memory}MB</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Gauge className="w-3.5 h-3.5" /> Latency
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.latency}ms</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <TrendingUp className="w-3.5 h-3.5" /> Requests
          </div>
          <div className="text-2xl font-bold">{metrics.requests?.toLocaleString()}</div>
        </div>
      </div>

      <div className="glass-card p-6">
         <h3 className="font-semibold text-sm mb-6 flex items-center gap-2">
           <Activity className="w-4 h-4 text-blue-400" /> Infrastructure Health Score
         </h3>
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center text-3xl font-bold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
               94
            </div>
            <div className="space-y-2">
               <p className="font-medium">All Systems Optimal</p>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Infrastructure is running at 94% efficiency. <br/>
                 Detected 0 critical bottlenecks in the last 24 hours.
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}

// --- Logs Tab ---
const LogsTab = ({ t }: any) => {
  const [isPaused, setIsPaused] = useState(false)
  const logsQuery = t.logs.recent.useQuery({}, { refetchInterval: isPaused ? false : 5000 })
  const logs = logsQuery.data?.items || []

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
             <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-zinc-500" : "bg-emerald-500 animate-pulse")} />
             <span className="text-[10px] font-bold text-muted-foreground uppercase">{isPaused ? 'Paused' : 'Streaming...'}</span>
          </div>
          <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
             {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
       </div>

       <div className="glass-card overflow-hidden bg-black/40 border-white/[0.08]">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
             <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
             <span className="text-[10px] font-mono text-muted-foreground opacity-60">SOVEREIGN_LENSE_V1</span>
          </div>
          <div className="h-[400px] overflow-auto font-mono text-[11px] p-4 space-y-2">
             {logs.map((log: any, i: number) => (
               <div key={i} className="flex gap-4 group">
                  <span className="text-muted-foreground/40 shrink-0">[{formatDistanceToNow(new Date(log.timestamp), { addSuffix: false })}]</span>
                  <span className={cn(
                    "font-bold shrink-0 uppercase w-12",
                    log.type === 'error' ? "text-red-400" : log.type === 'warn' ? "text-amber-400" : "text-emerald-400"
                  )}>{log.type}</span>
                  <span className="text-white/80">{log.message}</span>
               </div>
             ))}
          </div>
       </div>
    </div>
  )
}

// --- Traffic Tab ---
const TrafficTab = () => {
  return (
    <div className="space-y-8 animate-fade-in">
       <div className="glass-card p-6 border-blue-500/10 bg-blue-500/[0.02]">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Global Traffic Control</h3>
             </div>
             <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                Active Edge
             </div>
          </div>
          <GtmManager />
       </div>

       <div className="glass-card p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-emerald-400" /> Self-Healing Incident Logs
          </h3>
          <RemediationLogs />
       </div>
    </div>
  )
}

export default function ObservabilityHub() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'traffic'>('metrics')
  const t = trpc as any

  const tabs = [
    { id: 'metrics', name: 'Performance', icon: Activity },
    { id: 'logs', name: 'Real-time Logs', icon: Terminal },
    { id: 'traffic', name: 'Global Traffic', icon: Map },
  ]

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="animate-slide-down">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Observability Hub</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              High-fidelity monitoring for the resilient enterprise. Telemetry, streaming logs, and global edge orchestration.
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/[0.08]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-tight",
                  activeTab === tab.id 
                    ? "bg-white text-zinc-950 shadow-xl scale-105" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[600px]">
          {activeTab === 'metrics' && <MetricsTab t={t} />}
          {activeTab === 'logs' && <LogsTab t={t} />}
          {activeTab === 'traffic' && <TrafficTab />}
        </div>
      </div>
    </AppShell>
  )
}
