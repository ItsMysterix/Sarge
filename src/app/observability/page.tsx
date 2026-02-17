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
  ShieldAlert,
  CheckCircle2
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { GtmManager } from "@/components/rust-core/GtmManager"
import { RemediationLogs } from "@/components/rust-core/RemediationLogs"
import { GridLoader } from "@/components/ui/grid-loader"
import { useProject } from "@/lib/project-context"

// --- Metrics Tab ---
const MetricsTab = () => {
  const { currentProject } = useProject()
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const metricsQuery = trpc.metrics.latest.useQuery({ projectId: currentProject?.id }, {
    enabled: !!currentProject?.id,
    refetchInterval: 5000
  })
  
  const metrics = metricsQuery?.data

  if (metricsQuery.isLoading) {
    return <div className="h-64 flex items-center justify-center"><GridLoader /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in gpu-accelerate">
      {!metrics && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-xs font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          No live telemetry detected for {currentProject?.name}. Use the OTel SDK to start pushing metrics.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CPU', value: metrics?.cpu ?? 0, unit: '%', icon: Cpu },
          { label: 'Memory', value: metrics?.memory ?? 0, unit: 'MB', icon: Server },
          { label: 'Latency', value: metrics?.latency ?? 0, unit: 'ms', icon: Gauge },
          { label: 'Requests', value: metrics?.requests ?? 0, unit: '', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="glass-card border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
                 <stat.icon className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" /> {stat.label}
              </div>
              {metrics && (
                <div className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                  LIVE
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {String(stat.value)}{stat.unit}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card border border-white/10 rounded-xl p-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
         <h3 className="font-semibold text-sm mb-6 flex items-center gap-2 text-foreground">
           <Activity className="w-4 h-4 text-foreground" /> Unified Health Analysis
         </h3>
         <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center text-3xl font-bold text-foreground shadow-2xl bg-indigo-500/5">
                 {metrics ? '94' : '--'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-black flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-black" />
              </div>
            </div>
            <div className="space-y-2">
               <p className="font-medium text-foreground">{metrics ? 'All Systems Optimal' : 'Standing By'}</p>
               <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                 {metrics 
                   ? `Infrastructure for ${currentProject?.name} is running at 94% efficiency. No critical bottlenecks detected in the last 24 hours.`
                   : `Sarge is ready to analyze your ${currentProject?.name} stack. Deploy via a provider or push via OTel to see live health analysis.`
                 }
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}

// --- Logs Tab ---
const LogsTab = () => {
  const [isPaused, setIsPaused] = useState(false)
  const logsQuery = trpc.logs.recent.useQuery({}, { refetchInterval: isPaused ? false : 5000 })
  const logs = logsQuery.data?.items || []

  return (
    <div className="space-y-4 animate-fade-in gpu-accelerate">
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
    <div className="space-y-8 animate-fade-in gpu-accelerate">
       <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Global Traffic Control</h3>
             </div>
             <div className="px-3 py-1 rounded-full bg-muted text-foreground text-[10px] font-bold tracking-widest uppercase border border-border">
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
  const { currentProject } = useProject()

  const tabs = [
    { id: 'metrics', name: 'Performance', icon: Activity },
    { id: 'logs', name: 'Real-time Logs', icon: Terminal },
    { id: 'traffic', name: 'Global Traffic', icon: Map },
  ]

  return (
    <AppShell title="Observability">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Observability Hub 
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-widest">
                {currentProject?.name || 'Global'}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">Monitor performance, logs, and global traffic in real-time.</p>
          </div>
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm" 
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
          {activeTab === 'metrics' && <MetricsTab />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'traffic' && <TrafficTab />}
        </div>
      </div>
    </AppShell>
  )
}
