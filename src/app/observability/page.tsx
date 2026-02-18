"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, 
  Terminal, 
  RefreshCw, 
  History,
  ShieldAlert
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"

export default function ObservatoryHub() {
  const { currentProject } = useProject()
  
  // High-Resolution Project Activity
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: currentProject?.slug || "" },
    { 
      enabled: !!currentProject?.slug,
      staleTime: 10000,
      refetchInterval: 5000 
    }
  )

  const activity = dashboardQuery.data?.activity || []

  if (!currentProject) {
    return (
      <AppShell title="Observatory">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
           <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
           <h2 className="text-xl font-bold">No Project Selected</h2>
           <p className="text-muted-foreground mt-2">Select a project from the sidebar to view localized activity streams.</p>
        </div>
      </AppShell>
    )
  }

  if (dashboardQuery.isLoading) {
    return (
      <AppShell title={`Observatory: ${currentProject.name}`}>
        <LoadingScreen title="Synchronizing Stream" subtitle="Aggregating project-specific event logs..." />
      </AppShell>
    )
  }

  if (dashboardQuery.error) {
    return (
      <AppShell title={`Observatory: ${currentProject.name}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
           <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
           <h2 className="text-xl font-bold">Telemetry Interrupted</h2>
           <p className="text-muted-foreground mt-2">{dashboardQuery.error.message}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={`Observatory: ${currentProject.name}`}>
      <div className="flex-1 flex flex-col bg-background">
        
        {/* Stream Header */}
        <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border py-4 px-6 md:px-10">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-muted rounded-lg border border-border">
                    <Activity className="w-4 h-4 text-foreground" />
                 </div>
                 <h2 className="text-lg font-bold">Project Activity Feed</h2>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-2 uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                 </span>
                 <button onClick={() => dashboardQuery.refetch()} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all">
                    <RefreshCw className={cn("w-4 h-4", dashboardQuery.isRefetching && "animate-spin")} />
                 </button>
              </div>
           </div>
        </div>

        {/* Unified Activity Stream */}
        <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-4xl mx-auto w-full">
           <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 md:p-10">
                 {activity.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                       <History className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                       <p className="text-sm text-muted-foreground italic">No infrastructure actions recorded for this project yet.</p>
                    </div>
                 ) : (
                    <div className="space-y-10 relative">
                       {/* Vertical Line */}
                       <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border" />
                       
                       {activity.map((item: any, i: number) => {
                          const isSuccess = item.action.includes('SUCCESS')
                          const isFailed = item.action.includes('FAILED')
                          const isCreation = item.action.includes('CREATED') || item.action.includes('PROVISIONED')

                          return (
                             <div key={item.id} className="relative pl-10 space-y-2 group">
                                {/* Dot */}
                                <div className={cn(
                                   "absolute left-0 top-1.5 w-2 h-2 rounded-full ring-4 ring-background transition-transform group-hover:scale-125",
                                   isSuccess ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
                                   isFailed ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : 
                                   isCreation ? "bg-blue-500" : "bg-indigo-500"
                                )} />
                                
                                <div className="flex items-center justify-between">
                                   <p className="text-sm font-bold text-foreground">
                                      {item.action.replace(/_/g, ' ')}
                                   </p>
                                   <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                      {formatDistanceToNow(new Date(item.created_at))} ago
                                   </span>
                                </div>

                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                                   <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                      {item.action.toLowerCase().includes('deploy') 
                                        ? `Deployment update for branch ${item.details?.branch || 'main'}` 
                                        : item.action.toLowerCase().includes('environment')
                                          ? `Infrastructure provisioning for ${item.details?.name || 'new environment'}`
                                          : JSON.stringify(item.details)}
                                   </p>
                                   {item.details?.commit && (
                                     <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground/40 bg-background/50 px-2 py-0.5 rounded w-fit">
                                        <Terminal className="w-3 h-3" />
                                        {item.details.commit.slice(0, 7)}
                                     </div>
                                   )}
                                </div>
                             </div>
                          )
                       })}
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </AppShell>
  )
}
