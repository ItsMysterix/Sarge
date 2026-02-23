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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Workflow className="w-4 h-4" /> Global Pipelines
           </h3>
           <p className="text-xs text-muted-foreground font-medium">Recent deployment activity across all projects</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 text-[10px] font-bold uppercase gap-2 hover:bg-muted">
           <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="w-full py-20"><LoadingScreen title="Fetching Pipelines" subtitle="Indexing global deployment history..." /></div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto" />
               <p className="text-xs text-muted-foreground font-medium">No global pipeline execution recorded yet.</p>
            </div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-muted/30 group transition-colors">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg border",
                  deploy.status === 'success' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" :
                  deploy.status === 'rolled-back' ? "border-amber-500/20 text-amber-500 bg-amber-500/5" :
                  "border-red-500/20 text-red-500 bg-red-500/5"
                )}>
                   {deploy.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                    deploy.status === 'rolled-back' ? <RotateCcw className="w-4 h-4" /> :
                    <XCircle className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground tracking-tight truncate">{deploy.summary || 'Pipeline Execution'}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded border-border bg-muted text-muted-foreground font-medium uppercase tracking-wide">
                       {deploy.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3 opacity-50" /> {deploy.branch || 'main'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 opacity-50" /> <TimeAgo datetime={deploy.created_at} /></span>
                    <span className="font-mono text-muted-foreground/70">#{deploy.commit?.slice(0,7)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   {deploy.status === 'success' && rollbackMutation && (
                     <Button variant="ghost" size="sm" onClick={() => rollbackMutation.mutate({ deploymentId: deploy.id })}
                       className="h-7 text-[10px] font-bold uppercase rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                       <RotateCcw className="w-3 h-3 mr-1" /> Rollback
                     </Button>
                   )}
                   <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase rounded-md">Logs</Button>
                   <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
