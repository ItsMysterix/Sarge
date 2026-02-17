"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Server, Database, Cpu, Globe, RefreshCcw, Settings, TrendingUp, 
  Activity, AlertTriangle, MoreVertical, Play, Pause, RotateCcw, 
  ExternalLink, Loader2
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const t = trpc as any
  const { data: services = [], isLoading, refetch } = t.services.all.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const filteredServices = services.filter((service: any) => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: services.length,
    up: services.filter((s: any) => s.status === "up").length,
    degraded: services.filter((s: any) => s.status === "degraded").length,
    down: services.filter((s: any) => s.status === "down").length,
    avgUptime: services.length > 0 
      ? (services.reduce((sum: number, s: any) => sum + Number(s.uptime_percent), 0) / services.length).toFixed(1)
      : 0
  }

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("api")) return Server
    if (name.toLowerCase().includes("database") || name.toLowerCase().includes("db")) return Database
    if (name.toLowerCase().includes("worker") || name.toLowerCase().includes("queue")) return Cpu
    return Globe
  }

  const getGrade = (uptime: number) => {
    if (uptime >= 99.5) return { grade: "A", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
    if (uptime >= 98) return { grade: "B", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
    return { grade: "C", color: "bg-red-500/20 text-red-400 border-red-500/30" }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Services</h1>
            <p className="text-sm text-muted-foreground">Manage running services and containers</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm hover:bg-white/[0.05] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          {[
            { label: "Total", value: stats.total, onClick: () => setStatusFilter("all"), active: statusFilter === "all" },
            { label: "Healthy", value: stats.up, color: "emerald", onClick: () => setStatusFilter(statusFilter === "up" ? "all" : "up"), active: statusFilter === "up" },
            { label: "Degraded", value: stats.degraded, color: "amber", onClick: () => setStatusFilter(statusFilter === "degraded" ? "all" : "degraded"), active: statusFilter === "degraded" },
            { label: "Down", value: stats.down, color: "red", onClick: () => setStatusFilter(statusFilter === "down" ? "all" : "down"), active: statusFilter === "down" },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className={cn(
                "p-4 rounded-xl text-left transition-all border",
                stat.active 
                  ? "bg-white/[0.05] border-white/[0.15]" 
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
              )}
            >
              <div className={cn(
                "text-2xl font-semibold mb-1",
                stat.color === "emerald" && "text-emerald-400",
                stat.color === "amber" && "text-amber-400",
                stat.color === "red" && "text-red-400"
              )}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filteredServices.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Server className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            filteredServices.map((service: any) => {
              const Icon = getIcon(service.name)
              const grade = getGrade(Number(service.uptime_percent))
              
              return (
                <div
                  key={service.id}
                  className="glass-card p-5 hover:border-white/20 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.status === "up" && "bg-emerald-500",
                            service.status === "degraded" && "bg-amber-500",
                            service.status === "down" && "bg-red-500"
                          )} />
                          <span className="text-xs text-muted-foreground capitalize">{service.status}</span>
                          <span className="text-xs text-muted-foreground">• {service.instance_count || 3} instances</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={cn("px-2.5 py-1 rounded-lg text-sm font-bold border", grade.color)}>
                        {grade.grade}
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: "Uptime", value: `${Number(service.uptime_percent).toFixed(1)}%` },
                      { label: "Cost/hr", value: `$${Number(service.cost_hr).toFixed(2)}` },
                      { label: "Req/min", value: service.requests || "1.2k" },
                      { label: "Latency", value: service.latency || "45ms" },
                    ].map((metric) => (
                      <div key={metric.label} className="p-2 rounded-lg bg-white/[0.02]">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{metric.label}</div>
                        <div className="text-sm font-medium">{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Uptime Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>24h uptime</span>
                      <span>{Number(service.uptime_percent).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          Number(service.uptime_percent) >= 99.5 ? "bg-emerald-500" :
                          Number(service.uptime_percent) >= 98 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, Number(service.uptime_percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-muted-foreground">
                      Deployed {formatDistanceToNow(new Date(service.created_at || Date.now()))} ago
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="Restart">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="View Logs">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="Settings">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing {filteredServices.length} of {stats.total} services</span>
          <span>Average uptime: {stats.avgUptime}%</span>
        </div>
      </div>
    </AppShell>
  )
}
