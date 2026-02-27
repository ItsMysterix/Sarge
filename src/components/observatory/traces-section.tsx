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
  const tracesQ = t.traces.list.useQuery()
  const traces = tracesQ?.data?.items || []
  const isLoading = tracesQ?.isLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Waypoints className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Distributed Telemetry</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">High-fidelity request propagation across micro-services</p>
          </div>
        </div>
        {tracesQ?.refetch && (
          <Button variant="outline" size="sm" onClick={() => tracesQ.refetch()} className="h-8 text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">
            <RefreshCw className={cn("w-3 h-3 mr-2", tracesQ.isRefetching && "animate-spin")} /> Re-Sample
          </Button>
        )}
      </div>

      {traces.length === 0 ? (
        <div className="py-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
          <Waypoints className="w-10 h-10 text-muted-foreground/20 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Zero Propagation</h3>
          <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">Configure OpenTelemetry to capture cross-service requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {traces.map((trace: any) => {
            const spans = trace.spans || []
            const totalDuration = trace.duration || spans.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
            const hasError = spans.some((s: any) => s.status === 'error')

            return (
              <div key={trace.traceId || trace.id} className={cn(
                "bg-[#050505] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-xl group",
                hasError && "border-l-2 border-l-red-500/50"
              )}>
                <div className="flex items-center gap-5 justify-between mb-6">
                   <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", 
                      hasError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-muted-foreground/40 group-hover:text-foreground"
                    )}>
                      <Waypoints className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                       <div className="flex items-center gap-3">
                        <p className="text-xs font-black font-mono text-foreground/80 tracking-widest">{(trace.traceId || trace.id || '').toUpperCase().slice(0, 16)}</p>
                        {hasError && <Badge variant="outline" className="text-[8px] font-black text-red-400 border-red-500/20 bg-red-500/5 uppercase tracking-widest">Deviance Detected</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1.5">
                        <span className="text-indigo-400/60">{trace.service || trace.rootService || 'ROOT_ORCHESTRATOR'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {totalDuration}ms</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{spans.length} Critical Units</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" className="h-8 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground">
                    Expand Trace <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>

                {/* Industrial Waterfall Visualization */}
                {spans.length > 0 && (
                  <div className="space-y-2.5 pl-14">
                    {spans.slice(0, 4).map((span: any, i: number) => {
                      const pct = totalDuration > 0 ? (span.duration / totalDuration) * 100 : 0
                      const offset = totalDuration > 0 ? ((span.startTime || 0) / totalDuration) * 100 : 0
                      return (
                        <div key={span.spanId || i} className="grid grid-cols-[140px_1fr_60px] gap-4 items-center">
                          <span className="truncate text-[9px] font-black text-white/30 uppercase tracking-widest font-mono group-hover:text-white/50 transition-colors">{span.name || span.operationName}</span>
                          <div className="h-1.5 bg-white/[0.02] rounded-full overflow-hidden relative">
                            <div
                              className={cn("absolute top-0 h-full rounded-full transition-all duration-1000",
                                span.status === 'error' ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-indigo-500/30"
                              )}
                              style={{ left: `${Math.min(offset, 95)}%`, width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <span className="text-right text-[10px] font-black font-mono text-muted-foreground/20 tabular-nums group-hover:text-muted-foreground/40 transition-colors">{span.duration}ms</span>
                        </div>
                      )
                    })}
                    {spans.length > 4 && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">+{spans.length - 4} Internal Segments</p>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
