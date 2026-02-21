"use client"

import { Waypoints, RefreshCw, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState, SectionHeader } from "./shared"

export const TracesSection = () => {
  const t = trpc as any
  const tracesQ = t.traces?.list?.useQuery?.()
  const traces = tracesQ?.data?.items || []
  const loading = tracesQ?.isLoading

  if (loading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader title="Distributed Traces" icon={Waypoints} action={
        tracesQ?.refetch && (
          <Button variant="ghost" size="sm" onClick={() => tracesQ.refetch()} className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", tracesQ?.isRefetching && "animate-spin")} /> Refresh
          </Button>
        )
      } />

      {traces.length === 0 ? (
        <EmptyState icon={Waypoints} title="No traces recorded." subtitle="Distributed traces will appear here once services are instrumented with tracing." />
      ) : (
        <div className="space-y-2">
          {traces.map((trace: any) => {
            const spans = trace.spans || []
            const totalDuration = trace.duration || spans.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
            const hasError = spans.some((s: any) => s.status === 'error')

            return (
              <Card key={trace.traceId || trace.id} className={cn("py-4", hasError && "border-l-2 border-l-red-500")}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn("p-2 rounded-lg", hasError ? "bg-red-500/10 text-red-400" : "bg-muted text-foreground")}>
                    <Waypoints className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate font-mono">{(trace.traceId || trace.id || '').slice(0, 16)}</p>
                      {hasError && <Badge variant="secondary" className="text-[9px] text-red-400 uppercase font-bold tracking-widest">Error</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{trace.service || trace.rootService || 'root'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {totalDuration}ms</span>
                      <span>{spans.length} spans</span>
                    </div>
                  </div>
                </div>

                {/* Mini waterfall */}
                {spans.length > 0 && (
                  <div className="space-y-1 ml-12">
                    {spans.slice(0, 5).map((span: any, i: number) => {
                      const pct = totalDuration > 0 ? (span.duration / totalDuration) * 100 : 0
                      const offset = totalDuration > 0 ? ((span.startTime || 0) / totalDuration) * 100 : 0
                      return (
                        <div key={span.spanId || i} className="flex items-center gap-2 text-[10px]">
                          <span className="w-[100px] truncate text-muted-foreground font-mono">{span.name || span.operationName}</span>
                          <div className="flex-1 h-3 bg-muted/20 rounded-sm overflow-hidden relative">
                            <div
                              className={cn("absolute top-0 h-full rounded-sm",
                                span.status === 'error' ? "bg-red-500/40" : "bg-indigo-500/30"
                              )}
                              style={{ left: `${Math.min(offset, 95)}%`, width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <span className="w-[50px] text-right text-muted-foreground tabular-nums">{span.duration}ms</span>
                        </div>
                      )
                    })}
                    {spans.length > 5 && (
                      <p className="text-[10px] text-muted-foreground/50 italic">+{spans.length - 5} more spans</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
