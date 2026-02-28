"use client"

import { ShieldAlert, ShieldCheck, RefreshCw, Bug, Package, ExternalLink, AlertTriangle, Activity, Search, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

export const SecuritySection = ({ projectSlug }: { projectSlug: string }) => {
  const t = trpc as any
  const secQuery = t.commandCenter.getSecurityAlerts.useQuery({ projectSlug })
  const alerts = secQuery.data || []
  
  const repoQuery = t.repository.list.useQuery()
  const primaryRepo = (repoQuery?.data || []).find((r: any) => r.is_primary)

  const vulnQuery = t.github.getVulnerabilities.useQuery(
    { owner: primaryRepo?.owner, repo: primaryRepo?.repo },
    { enabled: !!primaryRepo?.owner && !!primaryRepo?.repo }
  )
  const depsQuery = t.github.getDependencies.useQuery(
    { owner: primaryRepo?.owner, repo: primaryRepo?.repo },
    { enabled: !!primaryRepo?.owner && !!primaryRepo?.repo }
  )

  const vulns = vulnQuery?.data || { alerts: [], enabled: false }
  const deps = depsQuery?.data || { dependencies: [], totalCount: 0, byEcosystem: {}, byType: {} }
  const isLoading = secQuery.isLoading || vulnQuery.isLoading

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-40 bg-white/[0.01] border border-white/5 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 border-red-500/10 bg-red-500/5',
    high: 'text-orange-400 border-orange-500/10 bg-orange-500/5',
    medium: 'text-amber-400 border-amber-500/10 bg-amber-500/5',
    low: 'text-blue-400 border-blue-500/10 bg-blue-500/5',
    info: 'text-white/20 border-white/5 bg-white/5',
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Vulnerability Summary */}
      {vulns.enabled && (
        <div className="space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center relative">
                  <Bug className="w-6 h-6 text-red-500/60" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-tight">Security Vulnerabilities</h2>
                  <p className="text-xs text-red-500/40 mt-0.5 font-bold uppercase tracking-widest">
                    {vulns.alerts?.length || 0} Vulnerabilities detected in repository
                  </p>
                </div>
              </div>
              <Button onClick={() => vulnQuery.refetch()} size="sm" variant="outline" className="h-9 px-4 bg-white/[0.01] border-white/5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                <RefreshCw className={cn("w-3.5 h-3.5 mr-2", vulnQuery.isRefetching && "animate-spin")} /> Rescan
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {vulns.alerts?.length > 0 ? (
              vulns.alerts.slice(0, 5).map((v: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={v.id} 
                  className={cn(
                    "bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group transition-all hover:border-white/10 shadow-lg relative overflow-hidden"
                  )}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shrink-0", severityColor[v.severity] || severityColor.info)}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <p className="text-sm font-bold text-white/80 transition-colors uppercase truncate">{v.summary}</p>
                        <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5", severityColor[v.severity])}>{v.severity}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                         <span className="text-white/40">{v.package}</span>
                         <span className="w-1 h-1 bg-white/5 rounded-full" />
                         <span>Version {v.vulnerableRange}</span>
                         {v.patchedVersion && (
                            <span className="text-emerald-500/40">Fixed in {v.patchedVersion}</span>
                         )}
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="h-9 w-9 p-0 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-lg">
                    <a href={v.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </motion.div>
               ))
            ) : (
              <div className="py-20 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01] space-y-4">
                <ShieldCheck className="w-12 h-12 text-white/5" />
                <div className="text-center">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-white/20">No vulnerabilities found</h3>
                   <p className="text-[10px] text-white/5 mt-1 max-w-[280px]">Automated scanning has not detected any critical issues.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependency Summary */}
      {deps.totalCount > 0 && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
               <Package className="w-5 h-5 text-white/30" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dependency Distribution</h3>
              <p className="text-xs text-white/20 mt-0.5">Inventory across {Object.keys(deps.byEcosystem).length} ecosystems.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(deps.byEcosystem as Record<string, number>).map(([eco, count]) => (
              <div key={eco} className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-center group hover:bg-white/[0.03] transition-all">
                <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mb-2 truncate">{eco}</p>
                <p className="text-2xl font-bold text-white/60 tracking-tight group-hover:text-white transition-colors">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider Security Findings */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
           <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
               <ShieldAlert className="w-5 h-5 text-white/40" />
            </div>
            <div>
               <h2 className="text-sm font-bold text-white">Infrastructure Security</h2>
               <p className="text-xs text-white/20 mt-0.5">Consolidated findings from cloud providers.</p>
            </div>
          </div>
          <Button onClick={() => secQuery.refetch()} size="sm" variant="outline" className="h-9 px-4 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", secQuery.isRefetching && "animate-spin")} /> Synchronize
          </Button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-24 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01] space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white/5" />
            </div>
            <div className="text-center">
               <h3 className="text-xs font-bold uppercase tracking-widest text-white/20">All clear</h3>
               <p className="text-[10px] text-white/10 mt-1 max-w-[320px] leading-relaxed">
                  No security findings reported from active cloud integrations.
               </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((a: any, i: number) => (
              <div key={a.id || i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col group hover:border-white/10 transition-all shadow-xl">
                 <div className="flex items-start justify-between mb-6">
                   <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center border transition-all", severityColor[a.severity] || severityColor.info)}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5", severityColor[a.severity])}>{a.severity}</Badge>
                 </div>
                 
                 <div className="flex-1">
                    <p className="text-sm font-bold text-white/80 uppercase tracking-tight mb-2 truncate group-hover:text-white transition-colors">{a.title}</p>
                    <p className="text-[10px] text-white/20 line-clamp-2 leading-relaxed mb-6 italic">{a.description}</p>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/10">{a.providerName || a.providerId}</span>
                    {a.timestamp && <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">{formatDistanceToNow(new Date(a.timestamp))} ago</span>}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
