"use client"

import { HeartPulse, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState, SectionHeader } from "./shared"
import { formatDistanceToNow } from "date-fns"

export const HealthSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const deploysQ = t.deploy.getDeployments.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (last: any) => last.nextCursor }
  )
  const deployments = deploysQ.data?.pages?.flatMap((p: any) => p.items) || []
  const firstDeployId = deployments[0]?.id || ''
  const healthQ = t.healthChecks.list.useQuery({ deploymentId: firstDeployId }, { enabled: !!firstDeployId })
  const checks = healthQ?.data || []
  const isLoading = deploysQ.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <HeartPulse className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Health & Liveness Probes</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Monitoring {checks.length} active service endpoints</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => deploysQ.refetch()} 
          className="h-8 text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5"
        >
          <RefreshCw className={cn("w-3 h-3 mr-2", deploysQ.isRefetching && "animate-spin")} /> Re-probe
        </Button>
      </div>

      {checks.length === 0 ? (
        <div className="py-24 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
          <HeartPulse className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Pulse Flatlined</h3>
          <p className="text-[10px] text-muted-foreground/40 mt-1 max-w-sm text-center">No active health checks configured for current microservices.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {checks.map((check: any) => {
            const isHealthy = check.last_status === true || check.last_status === 'healthy'
            return (
              <div key={check.id} className="group bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex items-center gap-6 shadow-sm">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center relative",
                  isHealthy ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  {isHealthy && <div className="absolute inset-0 rounded-xl bg-emerald-500/20 animate-ping opacity-20" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <p className="text-sm font-black text-foreground/90 tracking-tight truncate">{check.endpoint}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/5 border-white/10">{check.check_type}</Badge>
                  </div>
                  <div className="flex items-center gap-5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> T- {check.interval_seconds}s</span>
                    {check.response_time && <span className="font-mono text-indigo-400/80">{check.response_time}ms Latency</span>}
                    {check.last_checked && <span>Checked {formatDistanceToNow(new Date(check.last_checked))} ago</span>}
                  </div>
                </div>

                <div className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                  isHealthy ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 rotate-[-2deg]" : "text-red-400 border-red-500/20 bg-red-500/5 rotate-[2deg]"
                )}>
                  {isHealthy ? "Operational" : "Degraded"}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deployments.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-white/5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Deployment Success History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployments.slice(0, 6).map((d: any) => (
              <div key={d.id} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-all">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  d.status === 'success' ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" : d.status === 'failed' ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-foreground/80 truncate uppercase tracking-tight">{d.summary || d.branch || 'Deployment'}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">{d.created_at && formatDistanceToNow(new Date(d.created_at))} ago</p>
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/5 border-white/10 opacity-60">{d.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
