"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { 
  GitBranch, 
  Box, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Globe, 
  ExternalLink, 
  RotateCcw, 
  ChevronRight, 
  RefreshCw, 
  GitCommit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { formatDistanceToNow } from "date-fns"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  
  const projectSlug = params.slug

  // Consolidated Data Fetching
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000, refetchOnWindowFocus: false }
  )
  
  const project = dashboardQuery.data?.project
  const stats = dashboardQuery.data?.stats
  const activity = dashboardQuery.data?.activity || []
  const latestDeployment = (dashboardQuery.data as any)?.latestDeployment

  // Loading State
  if (dashboardQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Project" subtitle="Synchronizing project telemetry..." />
      </AppShell>
    )
  }

  // Error State Handling
  if (dashboardQuery.error) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-red-500">Infrastructure Connection Error</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            {dashboardQuery.error.message.includes('Project not found') 
              ? "We couldn't locate this project. It may have been deleted or you may lack sufficient permissions."
              : `An error occurred: ${dashboardQuery.error.message}`}
          </p>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
              Retry Connection
            </Button>
            <Button variant="outline" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold">Project not found</h1>
          <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have access.</p>
          <Button variant="outline" className="mt-6" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </AppShell>
    )
  }

  const handleRollback = () => {
    addToast({ title: "Rollback Initiated", description: "Reverting to previous stable build...", type: "info" })
  }

  const handleVisit = () => {
    if (latestDeployment?.services?.[0]?.url) {
      window.open(latestDeployment.services[0].url, '_blank')
    } else {
      addToast({ title: "URL Missing", description: "Deployment URL not available yet.", type: "warning" })
    }
  }

  return (
    <AppShell title={project.name}>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in bg-background">
        <ToastContainer />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Column: Activity Feed (Keep as is) */}
           <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-sm font-semibold text-muted-foreground">Activity Feed</h2>
                 <Activity className="w-4 h-4 text-muted-foreground/30" />
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
                 <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[700px]">
                    {activity.length === 0 ? (
                       <p className="text-sm text-muted-foreground italic text-center py-10 opacity-40">No recent activity detected.</p>
                    ) : (
                       activity.map((item: any) => {
                          const isSuccess = item.action.includes('SUCCESS')
                          const isFailed = item.action.includes('FAILED')
                          
                          return (
                             <div key={item.id} className="relative pl-6 space-y-1 group">
                                <div className={cn(
                                   "absolute left-0 top-1.5 w-2 h-2 rounded-full ring-4 ring-background",
                                   isSuccess ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-indigo-500"
                                )} />
                                <div className="flex items-center justify-between">
                                   <p className="text-xs font-bold text-foreground">
                                      {item.action.replace(/_/g, ' ')}
                                   </p>
                                   <span className="text-[10px] text-muted-foreground/50 font-medium">
                                      {formatDistanceToNow(new Date(item.created_at))} ago
                                   </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground/70 truncate flex items-center gap-1">
                                   {item.details?.branch && <span className="opacity-50">→</span>}
                                   {item.details?.branch || item.details?.name || 'View details'}
                                </p>
                             </div>
                          )
                       })
                    )}
                 </div>
                 <div className="p-4 border-t border-border bg-muted/20">
                    <Button variant="ghost" className="w-full text-xs font-semibold h-8" onClick={() => router.push(`/projects/${projectSlug}/settings`)}>
                       Project Management
                    </Button>
                 </div>
              </div>
           </div>

           {/* Right Column: Deployment Details (The old environments area) */}
           <div className="lg:col-span-8 space-y-6">
              
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-sm font-semibold text-muted-foreground">Production Deployment</h2>
                 <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground group" onClick={() => dashboardQuery.refetch()}>
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> 
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Sync Telemetry</span>
                 </Button>
              </div>

              {/* Main Deployment Card (Refined per Screenshot) */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
                 <div className="p-8 md:p-10">
                    <div className="flex flex-col xl:flex-row gap-10">
                       
                       {/* Left: Preview Window */}
                       <div className="xl:w-1/3">
                          <div className="aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 relative overflow-hidden group/preview">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                             <Globe className="w-10 h-10 text-white/10 mb-3 group-hover/preview:scale-110 transition-transform" />
                             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Deployment Preview</p>
                          </div>
                       </div>

                       {/* Right: Deployment Details */}
                       <div className="xl:w-2/3 flex flex-col justify-between">
                          <div className="space-y-8">
                             
                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-1.5">
                                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Deployment URL</p>
                                   <p className="text-lg font-bold text-white tracking-tight select-all">
                                      {latestDeployment?.services?.[0]?.url?.replace('https://', '') || `${project.slug}-deployment.sarge.dev`}
                                   </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                   <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80" onClick={() => router.push(`/projects/${projectSlug}/logs`)}>
                                      Build Logs
                                   </Button>
                                   <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80" onClick={() => router.push(`/observability?project=${projectSlug}`)}>
                                      Runtime Logs
                                   </Button>
                                   <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-amber-500/80" onClick={handleRollback}>
                                      <RotateCcw className="w-3.5 h-3.5 mr-2" /> Rollback
                                   </Button>
                                   <Button size="sm" className="h-9 px-6 text-xs font-bold rounded-xl bg-white text-black hover:bg-white/90" onClick={handleVisit}>
                                      Visit <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                   </Button>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                                <div>
                                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Domains</p>
                                   <span className="text-sm font-bold text-white/90">{latestDeployment?.services?.[0]?.url?.replace('https://', '') || 'None'}</span>
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Status</p>
                                   <div className="flex items-center gap-2">
                                      <div className={cn(
                                         "w-2 h-2 rounded-full", 
                                         latestDeployment?.status === 'success' ? "bg-emerald-500" : "bg-amber-500"
                                      )} />
                                      <span className="text-sm font-bold text-white/90 capitalize">{latestDeployment?.status || 'Active'}</span>
                                   </div>
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Created</p>
                                   <p className="text-sm font-bold text-white/90">
                                      {latestDeployment?.created_at ? formatDistanceToNow(new Date(latestDeployment.created_at)) : '---'} ago
                                   </p>
                                </div>
                             </div>

                             <div className="pt-4">
                                <div className="flex items-center gap-6 text-xs font-bold">
                                   <div className="flex items-center gap-2 text-indigo-400">
                                      <GitBranch className="w-4 h-4" /> {latestDeployment?.branch || 'main'}
                                   </div>
                                   <div className="flex items-center gap-3 text-white/40">
                                      <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">{latestDeployment?.commit?.slice(0, 7) || '---'}</span>
                                      <span className="truncate max-w-[200px] font-medium">{latestDeployment?.summary?.split('] ').pop() || 'Initial project commit'}</span>
                                   </div>
                                </div>
                             </div>

                          </div>
                       </div>

                    </div>
                 </div>
              </div>

              {/* Auxiliary Stats */}
              <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: 'Platform Uptime', val: stats?.successfulDeployments ? `${((stats.successfulDeployments / (stats.totalDeployments || 1)) * 100).toFixed(1)}%` : "0%", icon: Activity },
                   { label: 'Build Velocity', val: stats?.avgDeployTime ? `${stats.avgDeployTime}s` : "---", icon: Clock },
                   { label: 'Compute Nodes', val: stats?.activeServices ?? 0, icon: Box }
                 ].map(m => (
                   <div key={m.label} className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:border-border/80 transition-all">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                         <m.icon className="w-3.5 h-3.5 opacity-50" /> {m.label}
                      </p>
                      <p className="text-xl font-bold text-foreground tabular-nums">{m.val}</p>
                   </div>
                 ))}
              </div>

           </div>
        </div>

      </div>
    </AppShell>
  )
}
