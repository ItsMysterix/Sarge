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

  if (auditQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <SectionHeader title="Audit Trail" icon={Lock} action={
        <Button variant="ghost" size="sm" onClick={() => auditQuery.refetch()} className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", auditQuery.isRefetching && "animate-spin")} /> Refresh
        </Button>
      } />
      {logs.length === 0 ? (
        <EmptyState icon={Lock} title="No audit events." subtitle="Account activity from providers will appear here." />
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            {logs.map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-[140px] shrink-0">
                  {log.timestamp ? format(new Date(log.timestamp), "MMM dd HH:mm:ss") : '--'}
                </span>
                <Badge variant="secondary" className="text-[9px] shrink-0 uppercase font-bold tracking-widest">{log.providerName || log.providerId}</Badge>
                <span className="text-xs text-foreground/80 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
