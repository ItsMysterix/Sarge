"use client"

import { Workflow, RefreshCw, Activity, CheckCircle2, RotateCcw, XCircle, GitBranch, Clock, ArrowUpRight } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TimeAgo from "timeago-react"

export const PipelinesTab = () => {
  const { data, isLoading, refetch, isRefetching } = trpc.deploy.getDeployments.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor }
  )
  const items = data?.pages.flatMap((page: any) => page.items) || []
  const rollbackMutation = trpc.deploy.rollback.useMutation({ onSuccess: () => refetch() })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] animate-pulse ring-1 ring-inset ring-white/[0.01]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center ring-1 ring-inset ring-white/[0.01] shadow-2xl">
             <Workflow className="w-7 h-7 text-muted-foreground/20" />
           </div>
           <div>
             <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Deployment_Propagation_Pipelines</h3>
             <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
               CI/CD Manifest Sync // Sovereign_Fleet_Orchestration
             </p>
           </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="h-14 px-8 bg-white/[0.02] border-white/5 text-white/40 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white/[0.05] transition-all shadow-xl active:scale-95 flex items-center gap-4">
           <RefreshCw className={cn("w-5 h-5", isRefetching && "animate-spin")} /> Re-Sample_Protocol_History
        </Button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-inset ring-white/[0.01]">
        <div className="divide-y divide-white/[0.03]">
          {items.length === 0 ? (
            <div className="py-48 text-center bg-transparent">
               <Activity className="w-16 h-16 text-muted-foreground/5 mx-auto mb-10" />
               <p className="text-[11px] font-black text-muted-foreground/20 uppercase tracking-[0.4em]">Zero_Orchestration_Executions_Detected</p>
            </div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-8 flex items-center gap-10 hover:bg-white/[0.01] group transition-all duration-700">
                <div className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-1000 shadow-2xl",
                  deploy.status === 'success' ? "border-emerald-500/10 text-emerald-400 bg-emerald-500/[0.02]" :
                  deploy.status === 'rolled-back' ? "border-amber-500/10 text-amber-400 bg-amber-500/[0.02]" :
                  "border-red-500/10 text-red-400 bg-red-500/[0.02]"
                )}>
                   {deploy.status === 'success' ? <CheckCircle2 className="w-7 h-7" /> :
                    deploy.status === 'rolled-back' ? <RotateCcw className="w-7 h-7" /> :
                    <XCircle className="w-7 h-7" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-6 mb-3">
                    <span className="text-[15px] font-black text-foreground/80 tracking-tight truncate uppercase">{deploy.summary || 'KERNEL_PROPAGATION_EVENT'}</span>
                    <div className={cn(
                      "text-[9px] px-4 py-1.5 rounded-xl border font-black uppercase tracking-[0.2em] shadow-inner",
                      deploy.status === 'success' ? "border-emerald-500/10 bg-emerald-500/[0.02] text-emerald-500/40" :
                      "border-white/5 bg-white/[0.02] text-muted-foreground/20"
                    )}>
                       {deploy.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-3"><GitBranch className="w-4 h-4 text-indigo-400/40" /> {deploy.branch || 'MAIN'}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                    <span className="flex items-center gap-3"><Clock className="w-4 h-4 text-muted-foreground/10" /> <TimeAgo datetime={deploy.created_at} /></span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                    <span className="font-mono text-indigo-400/[0.15] tracking-[0.3em] font-black">{deploy.commit?.toUpperCase().slice(0,8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
                   {deploy.status === 'success' && rollbackMutation && (
                     <Button variant="outline" onClick={() => rollbackMutation.mutate({ deploymentId: deploy.id })}
                       className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.3em] border-amber-500/10 bg-amber-500/[0.02] text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all">
                       <RotateCcw className="w-4 h-4 mr-3" /> Rollback_Node
                     </Button>
                   )}
                   <Button variant="ghost" className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 hover:text-foreground group/btn">
                     LOGS <ArrowUpRight className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                   </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
