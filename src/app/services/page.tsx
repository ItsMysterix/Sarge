"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Server, Database, Cpu, Globe, RefreshCcw, Settings, TrendingUp, 
  Activity, AlertTriangle, MoreVertical, Play, Pause, RotateCcw, 
  ExternalLink
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"

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
    if (uptime >= 99.5) return { grade: "A", color: "bg-foreground/10 text-foreground border-foreground/20" }
    if (uptime >= 98) return { grade: "B", color: "bg-muted text-muted-foreground border-border" }
    return { grade: "C", color: "bg-muted text-muted-foreground border-border" }
  }

  if (isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Synchronizing Services" subtitle="Fetching real-time infrastructure status..." />
      </AppShell>
    )
  }

  return (
    <AppShell title="Services">
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        
        <div className="flex justify-end mb-6">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm hover:bg-muted transition-colors text-foreground"
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
                  ? "bg-muted border-foreground/20" 
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "text-2xl font-semibold mb-1 text-foreground",
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
            className="w-full max-w-md px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-foreground/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filteredServices.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Server className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            filteredServices.map((service: any) => {
              const Icon = getIcon(service.name)
              const grade = getGrade(Number(service.uptime_percent))
              
              return (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{service.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            service.status === "up" && "bg-foreground",
                            service.status === "degraded" && "bg-muted-foreground",
                            service.status === "down" && "bg-muted-foreground/50"
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
                      <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
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
                      <div key={metric.label} className="p-2 rounded-lg bg-muted/30 border border-border">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{metric.label}</div>
                        <div className="text-sm font-medium text-foreground">{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Uptime Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>24h uptime</span>
                      <span>{Number(service.uptime_percent).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          Number(service.uptime_percent) >= 99.5 ? "bg-foreground" :
                          Number(service.uptime_percent) >= 98 ? "bg-muted-foreground" : "bg-muted-foreground/50"
                        )}
                        style={{ width: `${Math.min(100, Number(service.uptime_percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Deployed {formatDistanceToNow(new Date(service.created_at || Date.now()))} ago
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Restart">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="View Logs">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Settings">
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
