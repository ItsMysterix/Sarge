"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Search, RefreshCw, List, Columns, Play, Pause, Filter,
  Clock, X, Terminal, AlertTriangle, AlertCircle, Info, ShieldAlert
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { PROVIDER_COLORS, LEVEL_STYLES, EmptyState } from "./shared"
import { LogLine } from "./log-line"
import { ProviderLogPane } from "./provider-log-pane"

/**
 * Infer severity from log data — mirrors the logic in log-line.tsx
 * so the distribution bar counts match what the user sees visually.
 */
function classifySeverity(log: any): string {
  if (log.severity) return log.severity
  const level = log.level || ''
  if (level === 'fatal' || level === 'critical') return 'critical'
  if (level === 'error') return 'high'
  if (level === 'warn' || level === 'warning') return 'medium'
  const msg = (log.message || '').toLowerCase()
  if (msg.includes('oom') || msg.includes('crash') || msg.includes('fatal') || msg.includes('segfault')) return 'critical'
  if (msg.includes('timeout') || msg.includes('connection refused') || msg.includes('500') || msg.includes('502') || msg.includes('503')) return 'high'
  if (msg.includes('deprecated') || msg.includes('retry') || msg.includes('slow query') || msg.includes('429')) return 'medium'
  if (log.statusCode >= 500) return 'high'
  if (log.statusCode >= 400) return 'medium'
  return 'info'
}

const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-400', icon: ShieldAlert },
  { key: 'high', label: 'High', color: 'bg-red-400', textColor: 'text-red-400', icon: AlertCircle },
  { key: 'medium', label: 'Medium', color: 'bg-amber-400', textColor: 'text-amber-400', icon: AlertTriangle },
  { key: 'low', label: 'Low', color: 'bg-blue-400', textColor: 'text-blue-400', icon: Info },
  { key: 'info', label: 'Info', color: 'bg-zinc-500', textColor: 'text-zinc-400', icon: Info },
]

export const TelemetrySection = ({ projectSlug }: { projectSlug: string }) => {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')
  const [isLive, setIsLive] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<string[]>([])
  const [providerFilter, setProviderFilter] = useState<string[]>([])
  const [expandedPane, setExpandedPane] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState(5000)
  const unifiedScrollRef = useRef<HTMLDivElement>(null)
  const t = trpc as any

  // 1. Get environments to find active deployments
  const { data: envs } = t.environments.list.useQuery(
    { projectSlug },
    { enabled: !!projectSlug }
  )

  // 2. Extract deployments with their provider IDs
  const deployments = useMemo(() => {
    return (envs || []).flatMap((e: any) => {
      let meta: any = {}
      try {
        meta = typeof e.provider_metadata === 'string' ? JSON.parse(e.provider_metadata) : (e.provider_metadata || {})
      } catch {}
      return meta.deploymentId
        ? [{ deploymentId: meta.deploymentId, providerId: e.provider_id }]
        : []
    })
  }, [envs])

  // 3. Unique providers
  const activeProviders = useMemo(() =>
    [...new Set(deployments.map((d: any) => d.providerId))] as string[],
    [deployments]
  )

  // 4. Fetch unified logs
  const unifiedQuery = t.logs.unified.useQuery(
    { deployments, limit: 200 },
    { enabled: deployments.length > 0, refetchInterval: isLive ? pollInterval : false }
  )

  // 5. Fallback to DB logs if no remote deployments
  const listingQuery = t.logs.listing.useQuery(
    { projectId: projectSlug, search: search || undefined, limit: 100 },
    { enabled: deployments.length === 0, refetchInterval: isLive ? pollInterval : false }
  )

  const rawLogs: any[] = deployments.length > 0
    ? (unifiedQuery.data || [])
    : (listingQuery.data?.items || [])

  const isLoading = deployments.length > 0 ? unifiedQuery.isLoading : listingQuery.isLoading
  const isRefetching = deployments.length > 0 ? unifiedQuery.isRefetching : listingQuery.isRefetching
  const doRefetch = deployments.length > 0 ? unifiedQuery.refetch : listingQuery.refetch

  // 6. Apply filters (including severity)
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((l: any) => {
      if (search && !l.message?.toLowerCase().includes(search.toLowerCase()) && !l.provider?.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter.length > 0 && !levelFilter.includes(l.level || 'info')) return false
      if (severityFilter.length > 0 && !severityFilter.includes(classifySeverity(l))) return false
      if (providerFilter.length > 0 && !providerFilter.includes(l.provider || '')) return false
      return true
    })
  }, [rawLogs, search, levelFilter, severityFilter, providerFilter])

  // 6b. Compute severity distribution from ALL raw logs (not filtered)
  const severityDist = useMemo(() => {
    const dist: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    for (const log of rawLogs) dist[classifySeverity(log)]++
    return dist
  }, [rawLogs])

  const totalLogs = rawLogs.length

  // 7. Group logs by provider for split view
  const logsByProvider = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    for (const p of activeProviders) grouped[p as string] = []
    for (const log of filteredLogs) {
      const p = log.provider || 'unknown'
      if (!grouped[p]) grouped[p] = []
      grouped[p].push(log)
    }
    return grouped
  }, [filteredLogs, activeProviders])

  // Auto-scroll unified view
  useEffect(() => {
    if (isLive && viewMode === 'unified' && unifiedScrollRef.current) {
      unifiedScrollRef.current.scrollTop = unifiedScrollRef.current.scrollHeight
    }
  }, [filteredLogs.length, isLive, viewMode])

  const toggleLevel = (level: string) =>
    setLevelFilter(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level])

  const toggleSeverity = (sev: string) =>
    setSeverityFilter(prev => prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev])

  const toggleProvider = (provider: string) =>
    setProviderFilter(prev => prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider])

  const providerCount = Object.keys(logsByProvider).length

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all provider logs..."
              className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-foreground/30 transition-colors font-medium"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex bg-muted/30 border border-border rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('unified')}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                viewMode === 'unified' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3 h-3" /> Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                viewMode === 'split' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns className="w-3 h-3" /> Split
            </button>
          </div>

          {/* Live toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all",
              isLive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {isLive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isLive ? "Live" : "Paused"}
          </button>

          <Button variant="outline" size="sm" onClick={() => doRefetch()} className="h-9 px-3 font-bold uppercase text-[10px] tracking-widest">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefetching && "animate-spin")} /> Sync
          </Button>
        </div>

        {/* Row 2: Severity Distribution Bar */}
        {totalLogs > 0 && (
          <div className="flex items-center gap-3">
            {/* Severity bar */}
            <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted/30">
              {SEVERITY_CONFIG.map(s => {
                const count = severityDist[s.key] || 0
                const pct = totalLogs > 0 ? (count / totalLogs) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={s.key}
                    className={cn(s.color, "transition-all duration-500 cursor-pointer hover:opacity-80")}
                    style={{ width: `${pct}%` }}
                    title={`${s.label}: ${count} (${pct.toFixed(0)}%)`}
                    onClick={() => toggleSeverity(s.key)}
                  />
                )
              })}
            </div>
            {/* Severity counts */}
            <div className="flex items-center gap-2">
              {SEVERITY_CONFIG.map(s => {
                const count = severityDist[s.key] || 0
                if (count === 0) return null
                const Icon = s.icon
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSeverity(s.key)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums transition-all",
                      severityFilter.includes(s.key)
                        ? `${s.textColor} bg-current/10 ring-1 ring-current/30`
                        : "text-muted-foreground/60 hover:text-foreground"
                    )}
                    title={`${s.label}: ${count}`}
                  >
                    <Icon className="w-3 h-3" />
                    {count}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Row 3: Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1">
            <Filter className="w-3 h-3 inline mr-1" />Filters:
          </span>

          {['info', 'warn', 'error', 'critical'].map(level => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={cn(
                "px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all",
                levelFilter.includes(level)
                  ? (LEVEL_STYLES[level] || 'text-red-500 bg-red-500/15') + " border-current"
                  : "bg-muted/20 border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
              )}
            >
              {level}
            </button>
          ))}

          {activeProviders.length > 0 && <div className="w-px h-5 bg-border mx-1" />}

          {activeProviders.map((p: string) => {
            const color = PROVIDER_COLORS[p] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
            return (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={cn(
                  "px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all",
                  providerFilter.includes(p)
                    ? color
                    : "bg-muted/20 border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
                )}
              >
                {p}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="bg-transparent border-none text-[10px] font-bold text-muted-foreground uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground/50">
            {filteredLogs.length} logs
          </span>
        </div>
      </div>

      {/* ── Log Viewer ── */}
      {isLoading ? (
        <div className="flex justify-center py-20"><GridLoader /></div>
      ) : viewMode === 'unified' ? (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-8">Message</div>
          </div>
          <div ref={unifiedScrollRef} className="max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground/50 text-xs font-medium">
                <Terminal className="w-8 h-8 mx-auto mb-3 opacity-30" />
                {deployments.length === 0
                  ? "No deployed environments. Deploy via the provisioning page to begin streaming logs."
                  : "No logs received yet. Waiting for provider telemetry..."
                }
              </div>
            ) : (
              filteredLogs.map((log: any, i: number) => (
                <LogLine key={log.id || i} log={log} search={search} showProvider={true} />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4",
          providerCount <= 1 ? "grid-cols-1" :
          providerCount === 2 ? "grid-cols-2" :
          providerCount === 3 ? "grid-cols-3" :
          "grid-cols-2 xl:grid-cols-3"
        )}>
          {Object.entries(logsByProvider).map(([providerId, logs]) => (
            <ProviderLogPane
              key={providerId}
              providerId={providerId}
              logs={logs}
              isLive={isLive}
              search={search}
              isExpanded={expandedPane === providerId}
              onToggleExpand={() => setExpandedPane(expandedPane === providerId ? null : providerId)}
            />
          ))}
          {Object.keys(logsByProvider).length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Columns} title="No providers streaming yet" subtitle="Deploy services to see per-provider log panes here." />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
