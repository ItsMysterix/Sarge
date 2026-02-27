"use client"

import { ShieldAlert, ShieldCheck, RefreshCw, Bug, Package, ExternalLink, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { formatDistanceToNow } from "date-fns"
import { Card, EmptyState, SectionHeader } from "./shared"

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
      <div className="space-y-10">
        <div className="h-48 bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 border-red-500/20 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    high: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
    medium: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    low: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    info: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5',
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      {/* Vulnerability Summary */}
      {vulns.enabled && (
        <div className="space-y-10">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 flex items-center gap-4">
              <Button onClick={() => vulnQuery.refetch()} className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all">
                <RefreshCw className={cn("w-3.5 h-3.5 mr-2", vulnQuery.isRefetching && "animate-spin")} /> Force_Scan
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full" />
                <Bug className="w-6 h-6 text-red-400 relative z-10" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Supply Chain Hardening</h2>
                <p className="text-[10px] font-bold text-red-500/40 uppercase tracking-widest leading-relaxed">
                   CRITICAL_DISCOVERY: {vulns.alerts?.length || 0} CVE detections in primary manifest stream
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {vulns.alerts?.length > 0 ? (
              vulns.alerts.slice(0, 8).map((v: any) => (
                <div key={v.id} className={cn(
                  "bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex items-center gap-8 group transition-all duration-700 hover:bg-white/[0.03] shadow-2xl relative overflow-hidden",
                  v.severity === 'critical' && "border-red-500/10"
                )}>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105", severityColor[v.severity] || severityColor.info)}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <p className="text-[13px] font-black text-foreground/90 tracking-tight truncate uppercase">{v.summary}</p>
                      <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.2em] h-6 px-3 border-white/5", severityColor[v.severity])}>{v.severity}</Badge>
                    </div>
                    <div className="flex items-center gap-5 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                       <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                          <span className="font-mono text-indigo-400/60 transition-colors group-hover:text-indigo-400">{v.package?.toUpperCase()}</span>
                       </div>
                       <span className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                       <span className="flex items-center gap-1.5">RANGE: {v.vulnerableRange}</span>
                       {v.patchedVersion && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                           <span className="text-emerald-400/80">FIX_STABLE: {v.patchedVersion}</span>
                        </div>
                       )}
                    </div>
                  </div>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/20 rounded-xl text-muted-foreground/40 hover:text-foreground transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
               ))
            ) : (
              <div className="py-32 border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-white/[0.01] space-y-6">
                <ShieldCheck className="w-16 h-16 text-emerald-500/10" />
                <div className="text-center space-y-2">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">Zero Manifest Violations</h3>
                   <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest max-w-[280px]">No critical supply chain entropy detected in primary protocol.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependencies Matrix */}
      {deps.totalCount > 0 && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-10">
            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl">
               <Package className="w-6 h-6 text-muted-foreground/20" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">Compositional Entropy Grid</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Object.entries(deps.byEcosystem as Record<string, number>).map(([eco, count]) => (
              <div key={eco} className="bg-[#050505] border border-white/5 rounded-3xl p-6 text-center hover:bg-white/[0.03] transition-all duration-500 ring-1 ring-inset ring-white/[0.01] group">
                <p className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.25em] mb-3 group-hover:text-indigo-400/40 transition-colors">{eco}</p>
                <p className="text-2xl font-black text-foreground/70 tracking-tighter group-hover:text-foreground transition-colors">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider Guard Relay */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-10">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
               <ShieldAlert className="w-6 h-6 text-indigo-400/60" />
            </div>
            <div className="flex flex-col">
               <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Relay Guard Matrix</h2>
               <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Cross-provider security finding bridge</p>
            </div>
          </div>
          <Button onClick={() => secQuery.refetch()} className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", secQuery.isRefetching && "animate-spin")} /> Force_Refetch
          </Button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-40 border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center bg-white/[0.01] space-y-8">
            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
              <ShieldCheck className="w-10 h-10 text-emerald-500/20 relative z-10" />
            </div>
            <div className="text-center space-y-2">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/40">Zero Deviation Signal</h3>
               <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest max-w-[320px] leading-relaxed">
                  CloudTrail & Security Hub report no active findings. Protocol parity achieved.
               </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
            {alerts.map((a: any, i: number) => (
              <div key={a.id || i} className="bg-[#050505] border border-white/5 rounded-[2rem] p-8 flex items-start gap-8 hover:border-indigo-500/20 transition-all duration-700 shadow-2xl relative overflow-hidden ring-1 ring-inset ring-white/[0.01] group">
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105", severityColor[a.severity] || severityColor.info)}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-4 mb-4">
                    <p className="text-[12px] font-black text-foreground/80 tracking-[0.1em] truncate uppercase">{a.title}</p>
                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.25em] h-6 px-3 border-white/5", severityColor[a.severity])}>{a.severity}</Badge>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-widest leading-relaxed line-clamp-3 mb-8">{a.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400/40">{a.providerName?.toUpperCase() || a.providerId?.toUpperCase()}</span>
                    {a.timestamp && <span className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em]">{formatDistanceToNow(new Date(a.timestamp)).toUpperCase()} AGO</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
