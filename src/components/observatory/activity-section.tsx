"use client"

import { RefreshCw, History, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { SectionHeader, EmptyState } from "./shared"

export const ActivitySection = ({ slug }: { slug: string }) => {
  const dashboardQuery = (trpc as any).project.getDashboardSummary.useQuery(
    { slug },
    { enabled: !!slug, staleTime: 10000 }
  )
  const activity = dashboardQuery.data?.activity || []
  const isLoading = dashboardQuery.isLoading

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-[2rem] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <History className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
             <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Causal Event Ledger</h2>
             <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Infrastructure entropy & state transformations</p>
          </div>
        </div>
        <Button 
          onClick={() => dashboardQuery.refetch()}
          className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Force_Re-sync
        </Button>
      </div>

      <div className="space-y-10 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[1px] before:bg-white/5">
        {activity.length === 0 ? (
          <div className="py-32 border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-white/[0.01] space-y-6">
            <Activity className="w-12 h-12 text-muted-foreground/10" />
            <div className="text-center space-y-2">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">Static Silence</h3>
               <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest max-w-[280px]">Initialize deployments to broadcast historical entropy signals.</p>
            </div>
          </div>
        ) : (
          activity.map((item: any, i: number) => (
            <div key={item.id} className="relative pl-16 group">
              <div className={cn(
                "absolute left-[18px] top-6 w-3 h-3 rounded-full ring-8 ring-[#0a0a0a] z-10 transition-all duration-500 group-hover:scale-125",
                item.action.includes('SUCCESS') ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
                item.action.includes('FAILED') ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : 
                "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              )} />
              
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/20 transition-all duration-700 hover:bg-white/[0.03] shadow-2xl relative overflow-hidden ring-1 ring-inset ring-white/[0.01]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.15em] text-foreground/90">{item.action.replace(/_/g, ' ')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    <span className="text-[9px] font-mono text-muted-foreground/20 uppercase tracking-widest">SEQ_HASH: {item.id.slice(0, 12).toUpperCase()}</span>
                  </div>
                  <div className="px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg">
                     <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{formatDistanceToNow(new Date(item.created_at)).toUpperCase()} AGO</span>
                  </div>
                </div>
                
                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 text-[10px] font-mono text-muted-foreground/40 leading-relaxed overflow-x-auto whitespace-pre-wrap ring-1 ring-inset ring-white/[0.01] hover:text-muted-foreground/60 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-indigo-500/20 border-b border-white/5 pb-2">
                     <span className="text-[8px] font-black uppercase tracking-widest">PAYLOAD_BUFFER</span>
                  </div>
                  {typeof item.details === 'string' ? item.details : JSON.stringify(item.details, null, 2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
