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

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((l: any) => {
      if (search && !l.message?.toLowerCase().includes(search.toLowerCase()) && !l.provider?.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter.length > 0 && !levelFilter.includes(l.level || 'info')) return false
      if (severityFilter.length > 0 && !severityFilter.includes(classifySeverity(l))) return false
      if (providerFilter.length > 0 && !providerFilter.includes(l.provider || '')) return false
      return true
    })
  }, [rawLogs, search, levelFilter, severityFilter, providerFilter])

  const severityDist = useMemo(() => {
    const dist: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    for (const log of rawLogs) dist[classifySeverity(log)]++
    return dist
  }, [rawLogs])

  const totalLogs = rawLogs.length

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search & Controls */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs and events..."
              className="w-full bg-black border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-black border border-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === 'unified' 
                    ? "bg-white text-black shadow-lg" 
                    : "text-white/10 hover:text-white/30"
                )}
              >
                <List className="w-3.5 h-3.5" /> Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === 'split' 
                    ? "bg-white text-black shadow-lg" 
                    : "text-white/10 hover:text-white/30"
                )}
              >
                <Columns className="w-3.5 h-3.5" /> Split
              </button>
            </div>

            <button
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                isLive
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400/60"
                  : "bg-white/[0.02] border-white/5 text-white/10"
              )}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isLive ? "bg-emerald-500 animate-pulse" : "bg-white/10")} />
              Live
            </button>

            <Button 
              onClick={() => doRefetch()} 
              variant="outline"
              size="sm"
              className="h-9 px-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-[10px] font-bold uppercase tracking-widest"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between pt-6 border-t border-white/5">
           <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Severity Distribution
                 </div>
                 <div className="text-[9px] font-bold text-white/10 tracking-widest uppercase">
                    {totalLogs} Events Captured
                 </div>
              </div>
              <div className="flex h-1 bg-white/5 rounded-full overflow-hidden">
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
                       <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[8px] font-bold uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          {s.label}: {count}
                       </div>
                    </motion.div>
                  )
                })}
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 px-3 py-1.5 bg-black border border-white/5 rounded-xl">
                 <Clock className="w-3.5 h-3.5 text-white/10" />
                 <select
                   value={pollInterval}
                   onChange={(e) => setPollInterval(Number(e.target.value))}
                   className="bg-transparent border-none text-[10px] font-bold text-white/30 uppercase tracking-widest outline-none cursor-pointer focus:text-white transition-colors"
                 >
                   <option value={2000}>2s Poll</option>
                   <option value={5000}>5s Poll</option>
                   <option value={10000}>10s Poll</option>
                   <option value={30000}>30s Poll</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-6 border-t border-white/5">
          <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-white/5">
            {['info', 'warn', 'error', 'critical'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                  levelFilter.includes(level)
                    ? "bg-white/[0.05] text-white"
                    : "text-white/10 hover:text-white/20"
                )}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-2">
            {activeProviders.map((p: string) => {
              const isActive = providerFilter.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => toggleProvider(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                    isActive
                      ? "bg-white/[0.05] text-white border-white/20"
                      : "bg-black border-white/5 text-white/10 hover:text-white/20"
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Logs View */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest text-white/10">
              <div className="col-span-1">Time</div>
              <div className="col-span-1">Level</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-8">Message</div>
            </div>
            <LogSkeleton />
          </motion.div>
        ) : viewMode === 'unified' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest text-white/10">
              <div className="col-span-1">Time</div>
              <div className="col-span-1">Level</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-8">Message</div>
            </div>
            <div ref={unifiedScrollRef} className="max-h-[800px] overflow-y-auto font-mono text-[11px] scrollbar-thin">
              {filteredLogs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-white/5">
                    <Terminal className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-white/20 uppercase tracking-widest">No logs found</h3>
                    <p className="text-[10px] text-white/10 mt-1">Waiting for incoming telemetry...</p>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
            "grid gap-6 pb-12",
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
