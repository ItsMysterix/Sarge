"use client"

import { Workflow, RefreshCw, Activity, CheckCircle2, RotateCcw, XCircle, GitBranch, Clock, ArrowUpRight } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TimeAgo from "timeago-react"
import { motion, AnimatePresence } from "framer-motion"

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
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg">
             <Workflow className="w-6 h-6 text-white/20" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white">Deployment History</h3>
             <p className="text-xs text-white/20 mt-0.5">Track and manage service deployments across environments.</p>
           </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 px-4 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2">
           <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-white/[0.03]">
          {items.length === 0 ? (
            <div className="py-32 text-center bg-transparent flex flex-col items-center">
               <Activity className="w-12 h-12 text-white/5 mb-6" />
               <p className="text-xs font-bold text-white/10 uppercase tracking-widest">No deployments detected</p>
            </div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-6 flex items-center gap-6 hover:bg-white/[0.01] group transition-all">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl border transition-all",
                  deploy.status === 'success' ? "border-emerald-500/10 text-emerald-400/60 bg-emerald-500/[0.02]" :
                  deploy.status === 'rolled-back' ? "border-amber-500/10 text-amber-400/60 bg-amber-500/[0.02]" :
                  "border-red-500/10 text-red-500/60 bg-red-500/[0.02]"
                )}>
                   {deploy.status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                    deploy.status === 'rolled-back' ? <RotateCcw className="w-6 h-6" /> :
                    <XCircle className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-white/80 transition-colors uppercase truncate">{deploy.summary || 'Production Deployment'}</span>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5",
                      deploy.status === 'success' ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400" :
                      deploy.status === 'rolled-back' ? "border-amber-500/10 bg-amber-500/5 text-amber-400" :
                      "border-red-500/10 bg-red-500/5 text-red-400"
                    )}>
                       {deploy.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-white/10 uppercase tracking-widest">
                    <span className="flex items-center gap-2 transition-colors hover:text-white/30 cursor-default">
                      <GitBranch className="w-3.5 h-3.5" /> 
                      {deploy.branch || 'main'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-white/5" />
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> 
                      <TimeAgo datetime={deploy.created_at} />
                    </span>
                    <div className="w-1 h-1 rounded-full bg-white/5" />
                    <span className="font-mono text-white/5">
                      {deploy.commit?.slice(0, 7)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   {deploy.status === 'success' && rollbackMutation && (
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => rollbackMutation.mutate({ deploymentId: deploy.id })}
                       className="h-9 px-4 border-amber-500/10 bg-amber-500/[0.02] text-amber-500/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest"
                     >
                       <RotateCcw className="w-3.5 h-3.5 mr-2" /> Rollback
                     </Button>
                   )}
                   <Button 
                     variant="ghost" 
                     size="sm"
                     className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-white group/btn"
                   >
                     Logs <ArrowUpRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
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
