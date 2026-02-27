"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, RefreshCw, List, Columns, Play, Pause, Filter,
  Clock, X, Terminal, AlertTriangle, AlertCircle, Info, ShieldAlert, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { PROVIDER_COLORS, LEVEL_STYLES, EmptyState } from "./shared"
import { LogLine } from "./log-line"
import { ProviderLogPane } from "./provider-log-pane"

const LogSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="w-16 h-3 bg-white/5 rounded" />
        <div className="w-12 h-3 bg-white/5 rounded" />
        <div className="w-24 h-3 bg-white/5 rounded" />
        <div className="flex-1 h-3 bg-white/5 rounded" />
      </div>
    ))}
  </div>
)

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

  const rawLogs = useMemo(() => {
    return deployments.length > 0
      ? (unifiedQuery.data || [])
      : (listingQuery.data?.items || [])
  }, [deployments.length, unifiedQuery.data, listingQuery.data])

  const isLoading = useMemo(() => {
    return deployments.length > 0 ? unifiedQuery.isLoading : listingQuery.isLoading
  }, [deployments.length, unifiedQuery.isLoading, listingQuery.isLoading])

  const isRefetching = useMemo(() => {
    return deployments.length > 0 ? unifiedQuery.isRefetching : listingQuery.isRefetching
  }, [deployments.length, unifiedQuery.isRefetching, listingQuery.isRefetching])

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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* ── Control Deck ── */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        {/* Row 1: Search + View Interface */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-indigo-400 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH PROTOCOLS & LOG PAYLOADS..."
              className="w-full bg-[#050505] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/10"
            />
          </div>

          <div className="flex items-center gap-3">
             {/* View mode toggle */}
            <div className="flex bg-[#050505] border border-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5",
                  viewMode === 'unified' 
                    ? "bg-white text-black shadow-lg" 
                    : "text-muted-foreground/30 hover:text-muted-foreground/60"
                )}
              >
                <List className="w-3.5 h-3.5" /> Unified_Stream
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5",
                  viewMode === 'split' 
                    ? "bg-white text-black shadow-lg" 
                    : "text-muted-foreground/30 hover:text-muted-foreground/60"
                )}
              >
                <Columns className="w-3.5 h-3.5" /> Matrix_View
              </button>
            </div>

            {/* Live toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                isLive
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-white/[0.02] border-white/5 text-muted-foreground/30 hover:text-muted-foreground/60"
              )}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isLive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/20")} />
              {isLive ? "Stream_Live" : "Pipe_Paused"}
            </button>

            <Button 
              onClick={() => doRefetch()} 
              variant="outline"
              className="h-10 px-5 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-[9px] font-black uppercase tracking-[0.25em]"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isRefetching && "animate-spin")} /> Force_Sync
            </Button>
          </div>
        </div>

        {/* Row 2: Severity distribution & Poll Control */}
        <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between">
           <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Entropy_Distribution
                 </div>
                 <div className="text-[9px] font-black text-muted-foreground/20 tracking-widest uppercase">
                    Sample_Size: {totalLogs} Events
                 </div>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                {SEVERITY_CONFIG.map(s => {
                  const count = severityDist[s.key] || 0
                  const pct = totalLogs > 0 ? (count / totalLogs) * 100 : 0
                  if (pct === 0) return null
                  return (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      key={s.key}
                      className={cn(s.color, "transition-all duration-500 relative group cursor-pointer hover:brightness-125")}
                      onClick={() => toggleSeverity(s.key)}
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          {s.label}: {count} ({pct.toFixed(0)}%)
                       </div>
                    </motion.div>
                  )
                })}
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 px-4 py-2.5 bg-[#050505] border border-white/5 rounded-xl">
                 <Clock className="w-3.5 h-3.5 text-muted-foreground/20" />
                 <select
                   value={pollInterval}
                   onChange={(e) => setPollInterval(Number(e.target.value))}
                   className="bg-transparent border-none text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest outline-none cursor-pointer focus:text-indigo-400 transition-colors"
                 >
                   <option value={2000}>Buffer_2s</option>
                   <option value={5000}>Buffer_5s</option>
                   <option value={10000}>Buffer_10s</option>
                   <option value={30000}>Buffer_30s</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Row 3: Filter Matrix */}
        <div className="flex items-center gap-3 flex-wrap pt-8 border-t border-white/5">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mr-2">
            <Filter className="w-3 h-3 text-indigo-400" />
          </div>

          <div className="flex items-center gap-2 bg-[#050505] p-1 rounded-xl border border-white/5">
            {['info', 'warn', 'error', 'critical'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                  levelFilter.includes(level)
                    ? (LEVEL_STYLES[level] || 'text-red-500 bg-red-500/15')
                    : "text-muted-foreground/20 hover:text-muted-foreground/40"
                )}
              >
                {level}
              </button>
            ))}
          </div>

          {activeProviders.length > 0 && <div className="w-px h-6 bg-white/5 mx-2" />}

          <div className="flex items-center gap-2">
            {activeProviders.map((p: string) => {
              const color = PROVIDER_COLORS[p] || 'bg-zinc-500/5 text-zinc-400/40 border-zinc-500/10'
              const isActive = providerFilter.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => toggleProvider(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                    isActive
                      ? color + " shadow-lg"
                      : "bg-[#050505] border-white/5 text-muted-foreground/20 hover:text-muted-foreground/40 hover:border-white/10"
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <div className="ml-auto text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">
            Stream_Count: <span className="text-foreground/40">{filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* ── Ledger Interface ── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.01] text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
              <div className="col-span-1">Timestamp</div>
              <div className="col-span-1">Entropy</div>
              <div className="col-span-2">Telemetry_Node</div>
              <div className="col-span-8">Payload_Data</div>
            </div>
            <div className="p-4 space-y-4">
               {[...Array(12)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse px-2">
                  <div className="w-20 h-2 bg-white/5 rounded-full" />
                  <div className="w-16 h-2 bg-white/5 rounded-full" />
                  <div className="w-32 h-2 bg-white/5 rounded-full" />
                  <div className="flex-1 h-2 bg-white/5 rounded-full" />
                </div>
               ))}
            </div>
          </motion.div>
        ) : viewMode === 'unified' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl group transition-all duration-700"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.01] text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 ring-1 ring-inset ring-white/[0.02]">
              <div className="col-span-1">Timestamp</div>
              <div className="col-span-1">Entropy</div>
              <div className="col-span-2">Telemetry_Node</div>
              <div className="col-span-8">Payload_Data</div>
            </div>
            <div ref={unifiedScrollRef} className="max-h-[800px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-indigo-500/20 transition-all">
              {filteredLogs.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center justify-center space-y-8">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full animate-pulse" />
                    <Terminal className="w-10 h-10 text-muted-foreground/10 relative z-10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-foreground/70 uppercase tracking-[0.3em]">Stream_Pipeline_Empty</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                      {deployments.length === 0
                        ? "Zero active deployments mapped. Initialize provisioning engine to bridge telemetry."
                        : "Handshake established. Waiting for remote telemetry node to broadcast protocols."
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.02]">
                  {filteredLogs.map((log: any, i: number) => (
                    <LogLine key={log.id || i} log={log} search={search} showProvider={true} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
            "grid gap-8 pb-12",
            providerCount <= 1 ? "grid-cols-1" :
            providerCount === 2 ? "grid-cols-2" :
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
                <div className="py-32 border border-dashed border-white/5 rounded-[2.5rem] text-center flex flex-col items-center justify-center bg-white/[0.01] space-y-6">
                   <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-2xl">
                     <Columns className="w-8 h-8 text-muted-foreground/10" />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-xs font-black text-foreground/40 uppercase tracking-[0.3em]">Parallel_Panes_Locked</h3>
                     <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest max-w-[280px]">Deploy multi-node clusters to unlock parallel matrix telemetry.</p>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
