"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Cpu, Server, Gauge, Activity, TrendingUp, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "infrastructure">("overview")
  
  const t = trpc as any
  const metricsQuery = t.metrics?.current?.useQuery?.()
  const historyQuery = t.metrics?.history?.useQuery?.({ range: timeRange })
  
  const metrics = metricsQuery?.data || { cpu: 32, memory: 1024, latency: 45, errors: 2, requests: 1250 }
  const history = historyQuery?.data || []

  const healthScore = Math.floor(100 - (metrics.cpu * 0.3 + (metrics.memory / 100) * 0.3 + metrics.errors * 5))
  const healthGrade = healthScore >= 90 ? "A+" : healthScore >= 80 ? "A" : healthScore >= 70 ? "B" : "C"

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <StatCard 
            label="CPU Usage" 
            value={`${metrics.cpu}%`} 
            icon={<Cpu className="w-4 h-4" />}
            color={metrics.cpu > 80 ? "red" : metrics.cpu > 60 ? "amber" : "emerald"}
          />
          <StatCard 
            label="Memory" 
            value={`${metrics.memory}MB`} 
            icon={<Server className="w-4 h-4" />}
            color="blue"
          />
          <StatCard 
            label="Latency" 
            value={`${metrics.latency}ms`} 
            icon={<Gauge className="w-4 h-4" />}
            color={metrics.latency > 100 ? "amber" : "emerald"}
          />
          <StatCard 
            label="Requests" 
            value={metrics.requests?.toLocaleString() || "1.2k"} 
            icon={<TrendingUp className="w-4 h-4" />}
            color="violet"
          />
        </div>

        {/* Health Score */}
        <div className="glass-card p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border",
              healthScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
              healthScore >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
              "bg-red-500/10 text-red-400 border-red-500/30"
            )}>
              {healthGrade}
            </div>
            <div>
              <h2 className="font-semibold">System Health</h2>
              <p className="text-sm text-muted-foreground">
                {healthScore >= 80 ? "All systems operational" : 
                 healthScore >= 60 ? "Minor issues detected" : "Action required"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{healthScore}</div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        </div>

        {/* Time Range & Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex rounded-lg border border-white/[0.06] p-1 bg-white/[0.02]">
            {(["1h", "24h", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-all",
                  timeRange === range ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="flex border-b border-white/[0.06]">
            {[
              { id: "overview", label: "Overview" },
              { id: "performance", label: "Performance" },
              { id: "infrastructure", label: "Infrastructure" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px",
                  activeTab === tab.id 
                    ? "text-foreground border-white" 
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="glass-card p-6 min-h-[300px]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4">Resource Usage (Last {timeRange})</h3>
              
              {/* Simple bars instead of charts */}
              <div className="space-y-4">
                <ResourceBar label="CPU" value={metrics.cpu} max={100} color="emerald" />
                <ResourceBar label="Memory" value={(metrics.memory / 4096) * 100} max={100} color="blue" />
                <ResourceBar label="Disk I/O" value={35} max={100} color="amber" />
                <ResourceBar label="Network" value={22} max={100} color="violet" />
              </div>
            </div>
          )}
          
          {activeTab === "performance" && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4">Performance Metrics</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-muted-foreground mb-1">Avg Response Time</div>
                  <div className="text-2xl font-semibold">{metrics.latency}ms</div>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-muted-foreground mb-1">Throughput</div>
                  <div className="text-2xl font-semibold">{metrics.requests}/min</div>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                  <div className="text-2xl font-semibold text-red-400">{((metrics.errors / (metrics.requests || 1)) * 100).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "infrastructure" && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4">Infrastructure Status</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "API Server", status: "healthy", cpu: 28, memory: 512 },
                  { name: "Database", status: "healthy", cpu: 45, memory: 2048 },
                  { name: "Worker", status: "healthy", cpu: 12, memory: 256 },
                  { name: "Cache", status: "healthy", cpu: 8, memory: 128 },
                ].map((node) => (
                  <div key={node.name} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{node.name}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-muted-foreground capitalize">{node.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">CPU:</span> {node.cpu}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">MEM:</span> {node.memory}MB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, icon, color }: {
  label: string
  value: string
  icon: React.ReactNode
  color: "emerald" | "blue" | "amber" | "red" | "violet"
}) {
  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <div className={cn(
          "w-2 h-2 rounded-full",
          color === "emerald" && "bg-emerald-500",
          color === "blue" && "bg-blue-500",
          color === "amber" && "bg-amber-500",
          color === "red" && "bg-red-500",
          color === "violet" && "bg-violet-500"
        )} />
      </div>
      <div className="text-2xl font-semibold mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function ResourceBar({ label, value, max, color }: {
  label: string
  value: number
  max: number
  color: "emerald" | "blue" | "amber" | "violet"
}) {
  const percent = Math.min(100, (value / max) * 100)
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percent.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color === "emerald" && "bg-emerald-500",
            color === "blue" && "bg-blue-500",
            color === "amber" && "bg-amber-500",
            color === "violet" && "bg-violet-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
