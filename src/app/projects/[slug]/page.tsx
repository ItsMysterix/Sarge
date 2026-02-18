"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { 
  GitBranch, 
  Layout,
  Plus,
  Box,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Clock,
  Activity,
  Server,
  Terminal,
  AlertTriangle,
  Globe,
  Cpu,
  ExternalLink,
  RotateCcw,
  FileText,
  History,
  MoreVertical,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Command,
  Github,
  GitCommit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { EnvironmentCreationModal } from "@/components/projects/EnvironmentCreationModal"
import { formatDistanceToNow } from "date-fns"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { currentProject } = useProject()
  const { addToast, ToastContainer } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const projectSlug = params.slug

  // Consolidated Data Fetching
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000, refetchOnWindowFocus: false }
  )
  
  const project = dashboardQuery.data?.project
  const environments = dashboardQuery.data?.environments || []
  const stats = dashboardQuery.data?.stats
  const activity = dashboardQuery.data?.activity || []
  const latestDeployment = (dashboardQuery.data as any)?.latestDeployment

  // Logic to find the latest environment worked with
  const latestEnvironment = environments[0] || null

  // Loading State
  if (dashboardQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Project" subtitle="Synchronizing environment data..." />
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
      addToast({ title: "No URL", description: "Deployment URL not available yet.", type: "warning" })
    }
  }

  return (
    <AppShell title={project.name} actions={
      <div className="flex gap-2">
         <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} variant="outline" className="h-9 px-4 text-xs font-semibold rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Environment
         </Button>
      </div>
    }>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-10 animate-fade-in bg-background">
        <ToastContainer />
        
        {showCreateModal && (
          <EnvironmentCreationModal 
            projectSlug={projectSlug} 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => dashboardQuery.refetch()}
          />
        )}

        {/* Latest Deployment (Production) Card */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Production Deployment</h2>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground" onClick={() => dashboardQuery.refetch()}>
                 <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Refresh
              </Button>
           </div>
           
           <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-8 md:p-10">
                 <div className="flex flex-col lg:flex-row gap-10">
                    <div className="lg:w-1/3">
                       <div className="aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-border/50">
                          <Globe className="w-10 h-10 text-muted-foreground/30 mb-3" />
                          <p className="text-xs text-muted-foreground">Deployment Preview</p>
                       </div>
                    </div>

                    <div className="lg:w-2/3 flex flex-col justify-between">
                       <div className="space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Deployment URL</p>
                                <p className="text-lg font-bold text-foreground truncate">
                                   {latestDeployment?.services?.[0]?.url?.replace('https://', '') || `${project.slug}.sarge.dev`}
                                </p>
                             </div>
                             <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg" onClick={() => router.push(`/projects/${projectSlug}/logs`)}>
                                   Build Logs
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg" onClick={() => router.push(`/observability?project=${projectSlug}`)}>
                                   Runtime Logs
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={handleRollback}>
                                   <RotateCcw className="w-3.5 h-3.5 mr-2" /> Rollback
                                </Button>
                                <Button size="sm" className="h-8 px-4 text-xs font-semibold rounded-lg" onClick={handleVisit}>
                                   Visit <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                </Button>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
                             <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Domains</p>
                                <span className="text-sm font-semibold">{latestDeployment?.services?.[0]?.url?.replace('https://', '') || 'None'}</span>
                             </div>
                             <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                   <div className={cn(
                                      "w-2 h-2 rounded-full", 
                                      latestDeployment?.status === 'success' ? "bg-emerald-500" : "bg-amber-500"
                                   )} />
                                   <span className="text-sm font-semibold capitalize">{latestDeployment?.status || 'Active'}</span>
                                </div>
                             </div>
                             <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                                <p className="text-sm font-semibold">
                                   {latestDeployment?.created_at ? formatDistanceToNow(new Date(latestDeployment.created_at)) : '---'} ago
                                </p>
                             </div>
                          </div>

                          <div className="pt-6">
                             <div className="flex items-center gap-4 text-sm font-medium">
                                <div className="flex items-center gap-2 text-indigo-600">
                                   <GitBranch className="w-4 h-4" /> {latestDeployment?.branch || 'main'}
                                </div>
                                <div className="text-muted-foreground/60">•</div>
                                <div className="flex items-center gap-2 truncate text-muted-foreground">
                                   <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{latestDeployment?.commit?.slice(0, 7) || '---'}</span>
                                   <span className="truncate">{latestDeployment?.summary?.split('] ').pop() || 'Initial commit'}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Lower Grid: Environments & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Left Segment: Environments */}
           <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-sm font-semibold text-muted-foreground">Environments</h2>
                 <Button variant="link" size="sm" className="text-xs" onClick={() => router.push(`/projects/${projectSlug}/provision`)}>
                    Manage All
                 </Button>
              </div>

              {environments.length === 0 ? (
                 <div className="p-10 border border-dashed border-border rounded-2xl bg-muted/20 text-center space-y-4">
                    <Box className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm text-muted-foreground">No active environments found.</p>
                    <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} size="sm">Create Environment</Button>
                 </div>
              ) : (
                 <div className="space-y-4">
                    {latestEnvironment && (
                       <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between hover:border-border/80 transition-all cursor-pointer shadow-sm" onClick={() => router.push(`/orchestration/deploy?project=${projectSlug}&env=${latestEnvironment.type}`)}>
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                                <Zap className="w-6 h-6 text-indigo-500" />
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <h3 className="text-lg font-bold">{latestEnvironment.name}</h3>
                                   <Badge variant="secondary" className="text-[10px] font-bold uppercase">{latestEnvironment.type}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                   <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {latestEnvironment.region}</span>
                                   <span>•</span>
                                   <span className="flex items-center gap-1.5">{latestEnvironment.status}</span>
                                </div>
                             </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                       </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {[
                         { label: 'Uptime', val: stats?.successfulDeployments ? `${((stats.successfulDeployments / (stats.totalDeployments || 1)) * 100).toFixed(1)}%` : "0%", icon: Activity },
                         { label: 'Avg Build', val: stats?.avgDeployTime ? `${stats.avgDeployTime}s` : "---", icon: Clock },
                         { label: 'Services', val: stats?.activeServices ?? 0, icon: Box }
                       ].map(m => (
                         <div key={m.label} className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                               <m.icon className="w-3 h-3" /> {m.label}
                            </p>
                            <p className="text-lg font-bold">{m.val}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>

           {/* Right Segment: Activity Feed */}
           <div className="lg:col-span-4 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Activity Feed</h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
                 <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px]">
                    {activity.length === 0 ? (
                       <p className="text-sm text-muted-foreground italic text-center py-10">No recent activity.</p>
                    ) : (
                       activity.map((item: any, i: number) => {
                          const isSuccess = item.action.includes('SUCCESS')
                          const isFailed = item.action.includes('FAILED')
                          
                          return (
                             <div key={item.id} className="relative pl-6 space-y-1">
                                <div className={cn(
                                   "absolute left-0 top-1.5 w-2 h-2 rounded-full",
                                   isSuccess ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-indigo-500"
                                )} />
                                <div className="flex items-center justify-between">
                                   <p className="text-xs font-bold text-foreground">
                                      {item.action.replace(/_/g, ' ')}
                                   </p>
                                   <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(item.created_at))}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                   {item.details?.branch || item.details?.name || 'View details'}
                                </p>
                             </div>
                          )
                       })
                    )}
                 </div>
                 <div className="p-4 border-t border-border">
                    <Button variant="ghost" className="w-full text-xs font-semibold h-8" onClick={() => router.push(`/projects/${projectSlug}/settings`)}>
                       View All Activity
                    </Button>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </AppShell>
  )
}
