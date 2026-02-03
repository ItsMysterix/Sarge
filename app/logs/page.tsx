"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import {
  Search, Download, AlertCircle, Info, AlertTriangle,
  Upload, Bookmark, BookmarkCheck, Clock, Pause, Play,
  FileDown, Terminal, Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { formatDistanceToNow } from "date-fns"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"

export default function LogsPage() {
  const t = trpc as any
  const [searchTerm, setSearchTerm] = useState("")
  const [bookmarkedLogs, setBookmarkedLogs] = useState<Set<string>>(new Set())
  const [isPaused, setIsPaused] = useState(false)
  const [timeRange, setTimeRange] = useState("1h")
  const [selectedService, setSelectedService] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const { addToast, ToastContainer } = useToast()

  const logsQuery = t.logs.recent.useQuery(
    { 
      type: levelFilter !== "all" ? levelFilter : undefined,
      service: selectedService !== "all" ? selectedService : undefined,
      search: searchTerm || undefined,
    },
    { 
      refetchOnWindowFocus: false, 
      enabled: !isPaused,
      refetchInterval: isPaused ? false : 5000,
    }
  )

  const servicesQuery = t.logs.services.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 60000,
  })

  const logs = logsQuery.data?.items || []
  const availableServices = servicesQuery.data || []

  const toggleBookmark = (logId: string) => {
    setBookmarkedLogs(prev => {
      const newSet = new Set(prev)
      newSet.has(logId) ? newSet.delete(logId) : newSet.add(logId)
      return newSet
    })
  }

  const exportLogs = (format: "json" | "csv") => {
    const dataStr = format === "json" 
      ? JSON.stringify(logs, null, 2)
      : [
          ["Timestamp", "Level", "Service", "Message"].join(","),
          ...logs.map((l: any) => [l.timestamp, l.type, l.service, l.message.replace(/,/g, ";")].join(","))
        ].join("\n")
    
    const blob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `logs-${new Date().toISOString()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: "success", title: "Exported", description: `Logs exported as ${format.toUpperCase()}` })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      const logsArray = Array.isArray(jsonData) ? jsonData : [jsonData]
      
      const transformedLogs = logsArray.map((log: any) => ({
        type: log.level?.toLowerCase() || log.type?.toLowerCase() || "info",
        message: log.message || log.msg || String(log),
        service: log.service || log.source || "unknown",
        timestamp: log.timestamp || log.time || new Date().toISOString(),
      }))

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedLogs),
      })

      addToast({ type: "success", title: "Uploaded", description: `${transformedLogs.length} log entries imported` })
    } catch (error) {
      addToast({ type: "error", title: "Upload Failed", description: "Could not parse log file" })
    }
  }

  const getLevelStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case "info": return { icon: Info, color: "text-blue-400", border: "border-l-blue-400", bg: "bg-blue-500/10" }
      case "warn": return { icon: AlertTriangle, color: "text-amber-400", border: "border-l-amber-400", bg: "bg-amber-500/10" }
      case "error": return { icon: AlertCircle, color: "text-red-400", border: "border-l-red-400", bg: "bg-red-500/10" }
      default: return { icon: Info, color: "text-muted-foreground", border: "border-l-white/20", bg: "bg-white/5" }
    }
  }

  const stats = {
    total: logs.length,
    info: logs.filter((l: any) => l.type === "info").length,
    warn: logs.filter((l: any) => l.type === "warn").length,
    error: logs.filter((l: any) => l.type === "error").length,
  }

  return (
    <AppShell>
      <ToastContainer />
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Logs</h1>
            <p className="text-sm text-muted-foreground">Real-time streaming logs across services</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isPaused 
                  ? "bg-white/5 text-muted-foreground" 
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              )}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? "Resume" : "Live"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 stagger-children">
          {[
            { label: "Total", value: stats.total, onClick: () => setLevelFilter("all"), active: levelFilter === "all" },
            { label: "Info", value: stats.info, color: "blue", onClick: () => setLevelFilter(levelFilter === "info" ? "all" : "info"), active: levelFilter === "info" },
            { label: "Warnings", value: stats.warn, color: "amber", onClick: () => setLevelFilter(levelFilter === "warn" ? "all" : "warn"), active: levelFilter === "warn" },
            { label: "Errors", value: stats.error, color: "red", onClick: () => setLevelFilter(levelFilter === "error" ? "all" : "error"), active: levelFilter === "error" },
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
                stat.color === "blue" && "text-blue-400",
                stat.color === "amber" && "text-amber-400",
                stat.color === "red" && "text-red-400"
              )}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Service Filter */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Services</option>
            {(availableServices as string[]).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Time Range */}
          <div className="flex rounded-lg border border-white/[0.06] p-1 bg-white/[0.02]">
            {["1h", "6h", "24h", "7d"].map((range) => (
              <button
                key={range}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-all",
                  timeRange === range ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Actions */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
            <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => exportLogs("json")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
          >
            <FileDown className="w-4 h-4" />
            JSON
          </button>

          <button
            onClick={() => exportLogs("csv")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>

        {/* Log Terminal */}
        <div className="glass-card overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/30">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">sarge-logs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-zinc-500" : "bg-emerald-500 animate-pulse")} />
              <span className="text-xs font-mono text-muted-foreground">{isPaused ? "PAUSED" : "LIVE"}</span>
            </div>
          </div>

          {/* Log Content */}
          <div className="max-h-[500px] overflow-y-auto">
            {logsQuery.isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">No logs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Logs will appear after you deploy or interact with your services
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {logs.map((log: any, i: number) => {
                  const styles = getLevelStyles(log.type)
                  const Icon = styles.icon
                  const isBookmarked = bookmarkedLogs.has(log.id)

                  return (
                    <div
                      key={log.id || i}
                      className={cn(
                        "px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors group border-l-2",
                        styles.border
                      )}
                    >
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", styles.color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-xs font-medium uppercase", styles.color)}>{log.type}</span>
                          <span className="text-xs text-muted-foreground">{log.service}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-foreground/80 break-all">{log.message}</p>
                      </div>

                      <button
                        onClick={() => toggleBookmark(log.id)}
                        className={cn(
                          "p-1 rounded shrink-0 transition-all",
                          isBookmarked 
                            ? "text-amber-400" 
                            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-400"
                        )}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Showing {logs.length} logs</span>
            {bookmarkedLogs.size > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <BookmarkCheck className="w-3 h-3" />
                {bookmarkedLogs.size} bookmarked
              </span>
            )}
          </div>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </AppShell>
  )
}
