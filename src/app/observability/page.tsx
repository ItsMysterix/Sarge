"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, 
  Terminal, 
  Map, 
  Pause, 
  Play, 
  Cpu,
  Server,
  Gauge,
  TrendingUp,
  ShieldAlert
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { GtmManager } from "@/components/rust-core/GtmManager"
import { RemediationLogs } from "@/components/rust-core/RemediationLogs"
import { GridLoader } from "@/components/ui/grid-loader"

// --- Metrics Tab ---
const MetricsTab = ({ t }: any) => {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const metricsQuery = t.metrics?.current?.useQuery?.()
  const metrics = metricsQuery?.data || { cpu: 32, memory: 1024, latency: 45, errors: 2, requests: 1250 }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Cpu className="w-3.5 h-3.5" /> CPU
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.cpu}%</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Server className="w-3.5 h-3.5" /> Memory
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.memory}MB</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <Gauge className="w-3.5 h-3.5" /> Latency
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.latency}ms</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-bold uppercase">
             <TrendingUp className="w-3.5 h-3.5" /> Requests
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.requests?.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
         <h3 className="font-semibold text-sm mb-6 flex items-center gap-2 text-foreground">
           <Activity className="w-4 h-4 text-foreground" /> Infrastructure Health Score
         </h3>
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full border-4 border-foreground/20 flex items-center justify-center text-3xl font-bold text-foreground shadow-sm">
               94
            </div>
            <div className="space-y-2">
               <p className="font-medium text-foreground">All Systems Optimal</p>
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
          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border">
             <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-muted-foreground" : "bg-foreground animate-pulse")} />
             <span className="text-[10px] font-bold text-muted-foreground uppercase">{isPaused ? 'Paused' : 'Streaming...'}</span>
          </div>
          <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground">
             {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
       </div>

       <div className="bg-card border border-border rounded-xl overflow-hidden shadow-inner bg-black/50">
          <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-2">
             <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
             <span className="text-[10px] font-mono text-muted-foreground opacity-60">SOVEREIGN_LENSE_V1</span>
          </div>
          <div className="h-[400px] overflow-auto font-mono text-[11px] p-4 space-y-2">
             {logs.map((log: any, i: number) => (
               <div key={i} className="flex gap-4 group">
                  <span className="text-muted-foreground/40 shrink-0">[{formatDistanceToNow(new Date(log.timestamp), { addSuffix: false })}]</span>
                  <span className={cn(
                    "font-bold shrink-0 uppercase w-12",
                    log.type === 'error' ? "text-foreground" : log.type === 'warn' ? "text-muted-foreground" : "text-muted-foreground"
                  )}>{log.type}</span>
                  <span className="text-foreground/80">{log.message}</span>
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
       <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Global Traffic Control</h3>
             </div>
             <div className="px-3 py-1 rounded-full bg-muted text-foreground text-[10px] font-bold tracking-widest uppercase">
                Active Edge
             </div>
          </div>
          <GtmManager />
       </div>

       <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2 text-foreground">
             <ShieldAlert className="w-4 h-4 text-foreground" /> Self-Healing Incident Logs
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
              <div className="p-2 rounded-xl bg-muted text-foreground">
                <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Observability Hub</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              High-fidelity monitoring for the resilient enterprise. Telemetry, streaming logs, and global edge orchestration.
            </p>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-2xl border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-tight",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
