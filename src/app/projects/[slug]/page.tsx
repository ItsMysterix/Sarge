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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { EnvironmentCreationModal } from "@/components/projects/EnvironmentCreationModal"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { currentProject } = useProject()
  const { addToast, ToastContainer } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const projectSlug = params.slug

  // Consolidated Data Fetching (High Performance)
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
              : `A telemetry error occurred: ${dashboardQuery.error.message}`}
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
         <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} variant="outline" className="h-9 px-4 text-xs font-bold uppercase tracking-widest border-white/5 bg-white/5 rounded-xl hover:bg-white/10">
            <Plus className="w-3.5 h-3.5 mr-2" /> Add Environment
         </Button>
      </div>
    }>
      <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-12 animate-fade-in bg-background no-scrollbar">
        <ToastContainer />
        
        {showCreateModal && (
          <EnvironmentCreationModal 
            projectSlug={projectSlug} 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => dashboardQuery.refetch()}
          />
        )}

        {/* Latest Deployment (Production) Card - Vercel Style */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic select-none">Production Deployment</h2>
              <div className="flex gap-2">
                 <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground" onClick={() => dashboardQuery.refetch()}>
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Refresh
                 </Button>
              </div>
           </div>
           
           <div className="bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
              
              <div className="p-8 md:p-12">
                 <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left: Deployment Preview / Screenshot Placeholder */}
                    <div className="lg:w-1/3">
                       <div className="aspect-video bg-foreground/[0.03] border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden group/preview pointer-events-none">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)]" />
                          <Globe className="w-12 h-12 text-muted-foreground/30 mb-4 group-hover/preview:scale-110 transition-transform" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Preview Synchronizing...</p>
                       </div>
                    </div>

                    {/* Right: Deployment Details */}
                    <div className="lg:w-2/3 flex flex-col justify-between">
                       <div className="space-y-8">
                          <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Deployment</p>
                                <p className="text-lg font-bold text-foreground tracking-tight select-all">
                                   {latestDeployment?.services?.[0]?.url?.replace('https://', '') || `${project.slug}-deployment.sarge.dev`}
                                </p>
                             </div>
                             <div className="flex items-center gap-3">
                                <Button variant="ghost" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/5" onClick={() => router.push(`/projects/${projectSlug}/logs`)}>
                                   Build Logs
                                </Button>
                                <Button variant="ghost" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/5" onClick={() => router.push(`/observability?project=${projectSlug}`)}>
                                   Runtime Logs
                                </Button>
                                <Button variant="ghost" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/5 text-amber-500" onClick={handleRollback}>
                                   <RotateCcw className="w-3.5 h-3.5 mr-2" /> Instant Rollback
                                </Button>
                                <Button className="h-9 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-foreground text-background hover:scale-105 transition-transform" onClick={handleVisit}>
                                   Visit <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                </Button>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-4 border-t border-white/[0.03]">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Domains</p>
                                <div className="flex items-center gap-2 group/domain cursor-pointer">
                                   <span className="text-xs font-bold text-foreground">{latestDeployment?.services?.[0]?.url?.replace('https://', '') || 'No domain linked'}</span>
                                   <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover/domain:opacity-100 transition-opacity" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Status</p>
                                <div className="flex items-center gap-2">
                                   <div className={cn(
                                      "w-1.5 h-1.5 rounded-full animate-pulse", 
                                      latestDeployment?.status === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
                                   )} />
                                   <span className="text-xs font-bold text-foreground capitalize">{latestDeployment?.status || 'Active'}</span>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Created</p>
                                <p className="text-xs font-bold text-foreground">
                                   {latestDeployment?.created_at ? formatDistanceToNow(new Date(latestDeployment.created_at)) : '---'} ago
                                </p>
                             </div>
                          </div>

                          <div className="pt-8 space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Source Code Context</p>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                                   <GitBranch className="w-4 h-4" /> {latestDeployment?.branch || 'main'}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium text-foreground/60 border-l border-white/5 pl-6">
                                   <GitCommit className="w-4 h-4 text-muted-foreground" />
                                   <span className="font-mono text-muted-foreground/40 pr-2">{latestDeployment?.commit?.slice(0, 7) || '---'}</span>
                                   <span className="italic truncate max-w-md">{latestDeployment?.summary?.split('] ').pop() || 'Initial project commit'}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="px-8 py-4 bg-white/[0.02] border-t border-white/[0.03] flex items-center justify-between">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                    <ChevronRight className="w-3.5 h-3.5" /> Deployment Settings
                    <Badge variant="outline" className="h-5 px-2 bg-indigo-500/5 text-indigo-400 border-indigo-500/20 text-[9px] font-black tracking-widest">4 Recommendations</Badge>
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground/20 italic">To build latest artifacts, push to the <span className="text-foreground/40">main</span> branch.</p>
              </div>
           </div>
        </section>

        {/* Lower Grid: Environments & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Left Segment: Environments (Latest Focus) */}
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic select-none">Environment Matrix</h2>
                 <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-400" onClick={() => router.push(`/projects/${projectSlug}/provision`)}>
                    Manage Cluster
                 </Button>
              </div>

              {environments.length === 0 ? (
                 <div className="p-12 border border-dashed border-white/5 rounded-3xl bg-foreground/[0.01] text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 mx-auto flex items-center justify-center border border-white/5">
                       <Box className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-foreground">Zero Active Environments</h3>
                       <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">Initialize a production, staging, or development cluster to begin deployments.</p>
                    </div>
                    <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} className="h-9 bg-foreground text-background">Establish First Environment</Button>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary/Latest Environment Detail */}
                    {latestEnvironment && (
                       <div className="md:col-span-3">
                          <div className="p-8 bg-foreground/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => router.push(`/orchestration/deploy?project=${projectSlug}&env=${latestEnvironment.type}`)}>
                             <div className="flex items-center gap-8">
                                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
                                   <Zap className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                   <div className="flex items-center gap-3 mb-1">
                                      <h3 className="text-xl font-bold text-foreground tracking-tight">{latestEnvironment.name}</h3>
                                      <Badge variant="outline" className="h-5 bg-indigo-500/10 text-indigo-400 border-indigo-400/20 text-[9px] font-black uppercase tracking-widest">{latestEnvironment.type}</Badge>
                                   </div>
                                   <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/40 tabular-nums uppercase tracking-widest">
                                      <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {latestEnvironment.region}</span>
                                      <span className="flex items-center gap-2 italic"><Cpu className="w-3.5 h-3.5" /> {latestEnvironment.status}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-8 pr-4">
                                <div className="text-right">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 mb-1 italic">Cluster Health</p>
                                   <p className="text-lg font-black text-emerald-500 italic tabular-nums">100<span className="text-[10px] font-bold ml-0.5">%</span></p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground">
                                   <ChevronRight className="w-5 h-5" />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              )}
              
              <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: 'Uptime', val: stats?.successfulDeployments ? `${((stats.successfulDeployments / (stats.totalDeployments || 1)) * 100).toFixed(1)}%` : "0%", icon: Activity },
                   { label: 'Avg Build', val: stats?.avgDeployTime ? `${stats.avgDeployTime}s` : "---", icon: Command },
                   { label: 'Services', val: stats?.activeServices ?? 0, icon: Box }
                 ].map(m => (
                   <div key={m.label} className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 mb-2 italic flex items-center gap-2">
                         <m.icon className="w-3.5 h-3.5" /> {m.label}
                      </p>
                      <p className="text-xl font-bold text-foreground italic tabular-nums">{m.val}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Right Segment: Activity Feed */}
           <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic select-none">Neural Activity</h2>
                 <History className="w-4 h-4 text-muted-foreground/20" />
              </div>

              <div className="bg-foreground/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col relative">
                 <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                 
                 <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {activity.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 italic">
                          <Activity className="w-8 h-8 mb-4 mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Awaiting system events...</p>
                       </div>
                    ) : (
                       activity.map((item: any, i: number) => {
                          const actionDisplay = item.action.split('_').join(' ')
                          const isSuccess = item.action.includes('SUCCESS')
                          const isFailed = item.action.includes('FAILED')
                          
                          return (
                             <div key={item.id} className="relative pl-8 group/item">
                                {i !== activity.length - 1 && (
                                   <div className="absolute left-1 top-4 bottom-[-32px] w-px bg-white/[0.03] group-hover/item:bg-white/[0.08] transition-colors" />
                                )}
                                <div className={cn(
                                   "absolute left-0 top-1 w-2.5 h-2.5 rounded-full border border-black z-10 transition-all",
                                   isSuccess ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
                                   isFailed ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : 
                                   "bg-indigo-500"
                                )} />
                                
                                <div className="space-y-1.5">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">{formatDistanceToNow(new Date(item.created_at))} ago</p>
                                   <h4 className="text-xs font-bold text-foreground capitalize tracking-tight group-hover/item:text-white transition-colors">
                                      {actionDisplay.toLowerCase()}
                                   </h4>
                                   <div className="text-[10px] text-muted-foreground font-mono font-medium truncate opacity-60 italic">
                                      {item.details?.branch ? `→ ${item.details.branch}` : (item.details?.name || JSON.stringify(item.details))}
                                   </div>
                                </div>
                             </div>
                          )
                       })
                    )}
                 </div>
                 
                 <div className="p-8 pt-0">
                    <Button variant="ghost" className="w-full h-10 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                       View Audit Artifacts
                    </Button>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </AppShell>
  )
}
