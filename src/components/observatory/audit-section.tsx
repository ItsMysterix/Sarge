"use client"

import { Lock, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { format } from "date-fns"
import { EmptyState, SectionHeader } from "./shared"

export const AuditSection = ({ projectSlug }: { projectSlug: string }) => {
  const auditQuery = trpc.commandCenter.getAuditLogs.useQuery({ projectSlug, limit: 100 })
  const logs = auditQuery.data || []
  const isLoading = auditQuery.isLoading

  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-xl overflow-hidden bg-[#050505]">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 border-b border-white/5 animate-pulse flex items-center px-6 gap-6">
            <div className="w-32 h-3 bg-white/5 rounded" />
            <div className="w-20 h-3 bg-white/5 rounded" />
            <div className="flex-1 h-3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <Lock className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Infrastructure Audit Trail</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Verified ledger of all cloud provider administrative actions</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => auditQuery.refetch()} className="h-8 text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">
          <RefreshCw className={cn("w-3 h-3 mr-2", auditQuery.isRefetching && "animate-spin")} /> Re-Sync Ledger
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="py-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
          <Lock className="w-10 h-10 text-muted-foreground/20 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Immutable Silence</h3>
          <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">No administrative events recorded in this epoch.</p>
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#050505] shadow-2xl">
          <div className="grid grid-cols-[160px_100px_1fr] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <div>Timestamp</div>
            <div>Source</div>
            <div>Event Description</div>
          </div>
          <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 font-mono">
            {logs.map((log: any, i: number) => (
              <div key={i} className="grid grid-cols-[160px_100px_1fr] gap-4 px-6 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center group">
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tabular-nums">
                  {log.timestamp ? format(new Date(log.timestamp), "MMM dd · HH:mm:ss") : '--'}
                </span>
                <div>
                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/5 border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
                    {log.providerName || log.providerId}
                  </Badge>
                </div>
                <span className="text-[11px] font-medium text-foreground/70 truncate group-hover:text-foreground transition-colors">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
