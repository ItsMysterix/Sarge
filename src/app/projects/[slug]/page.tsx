"use client"

import { useState, useEffect } from "react"
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
  GitCommit,
  Plus,
  Layers,
  Code,
  Sliders,
  CheckCircle2,
  Lock,
  Workflow
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  
  const projectSlug = params.slug
  const [fleetTab, setFleetTab] = useState<'production' | 'preview'>('production')
  const [targetReplicas, setTargetReplicas] = useState(2)

  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000, refetchOnWindowFocus: false }
  )
  
  const project = dashboardQuery.data?.project
  const activity = dashboardQuery.data?.activity || []
  const latestDeployment = (dashboardQuery.data as any)?.latestDeployment

  const driftQuery = trpc.kubernetes.detectDrift.useQuery(
    { deploymentId: latestDeployment?.id || '' },
    { enabled: !!latestDeployment?.id, refetchInterval: 15000 }
  )

  useEffect(() => {
    if (driftQuery.data?.driftDetails?.actual?.replicas) {
      setTargetReplicas(driftQuery.data.driftDetails.actual.replicas)
    } else if (latestDeployment?.replicas) {
      setTargetReplicas(latestDeployment.replicas)
    }
  }, [driftQuery.data?.driftDetails?.actual?.replicas, latestDeployment?.replicas])

  const scaleMutation = trpc.kubernetes.scale.useMutation({
    onSuccess: () => addToast({ title: 'Scaling Initiated', description: `Replicas set to ${targetReplicas}`, type: 'success' }),
    onError: (e) => addToast({ title: 'Scaling Failed', description: e.message, type: 'error' })
  })

  const reconcileMutation = trpc.kubernetes.redeploy.useMutation({
    onSuccess: () => {
      addToast({ title: 'System Reconciled', description: 'Drift remediation complete. Cluster matches configuration.', type: 'success' })
      driftQuery.refetch()
    },
    onError: (e) => addToast({ title: 'Reconciliation Failed', description: e.message, type: 'error' })
  })

  const exportMutation = trpc.export.exportToTerraform.useMutation({
    onMutate: () => addToast({ title: "Exporting...", description: "Ejecting configuration to Terraform", type: "info" }),
    onSuccess: (res) => {
      addToast({ title: "Export Complete", description: `Saved as ${res.fileName}`, type: "success" });
      const blob = new Blob([res.terraformCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      a.click();
    },
    onError: (e) => addToast({ title: "Export Failed", description: e.message, type: "error" })
  })

  if (dashboardQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Project" subtitle="Checking project status..." />
      </AppShell>
    )
  }

  if (dashboardQuery.error) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">Infrastructure Connection Error</h1>
          <p className="text-xs text-white/20 mt-2 max-w-sm uppercase font-bold tracking-widest">
            {dashboardQuery.error.message.includes('Project not found') 
              ? "We couldn't locate this project. Please check your access permissions."
              : `System error: ${dashboardQuery.error.message}`}
          </p>
          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={() => dashboardQuery.refetch()}>
              Retry
            </Button>
            <Button variant="outline" className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={() => router.push('/projects')}>
              Back
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
            <AlertTriangle className="w-12 h-12 text-white/10 mb-6" />
            <h1 className="text-xl font-bold text-white uppercase tracking-tight">Project not found</h1>
            <p className="text-xs text-white/20 mt-2 uppercase font-bold tracking-widest">The project you&apos;re looking for doesn&apos;t exist.</p>
            <Button variant="outline" className="mt-8 h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </AppShell>
    )
  }

  const handleVisit = () => {
    if (latestDeployment?.services?.[0]?.url) {
      window.open(latestDeployment.services[0].url, '_blank')
    } else {
      addToast({ title: "Deployment Pending", description: "URL not yet available.", type: "warning" })
    }
  }

  return (
    <AppShell title={project.name}>
      <div className="flex-1 p-8 lg:p-12 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
        <ToastContainer />

        {/* Hero Section */}
        {latestDeployment ? (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group mb-12">
            <div className="px-8 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active Deployment</span>
               </div>
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectSlug}/logs`)} className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-all">Logs</Button>
                 <Button variant="ghost" size="sm" onClick={() => addToast({title: "Rollback", description: "Action unavailable.", type: "info"})} className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest text-amber-500/40 hover:text-amber-400 transition-all">Rollback</Button>
               </div>
            </div>
            
            <div className="p-10 flex flex-col xl:flex-row items-center gap-12">
               <div className="w-full xl:w-[480px] aspect-video bg-black border border-white/5 rounded-2xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl shrink-0" onClick={handleVisit}>
                  <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-all" />
                  <Globe className="w-10 h-10 text-white/5 group-hover:scale-110 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-8 p-10">
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-3 border border-white/10 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md">Open Site <ExternalLink className="w-3.5 h-3.5"/></span>
                  </div>
               </div>
               
               <div className="flex-1 min-w-0 space-y-8">
                  <div className="space-y-4 text-center xl:text-left">
                     <h2 className="text-3xl font-bold tracking-tight text-white/90 truncate cursor-pointer hover:text-white transition-colors" onClick={handleVisit}>
                        {latestDeployment?.services?.[0]?.url?.replace('https://', '')?.toLowerCase() || `${project.slug}.sarge.dev`}
                     </h2>
                     <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3">
                        <Badge variant="outline" className="px-3 py-1 bg-white/[0.02] border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                          <GitBranch className="w-3 h-3 mr-2 text-white/20"/> {latestDeployment.branch || 'main'}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-white/[0.02] border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40 font-mono">
                          <GitCommit className="w-3 h-3 mr-2 text-white/20"/> {latestDeployment.commit?.slice(0, 7) || 'HEAD'}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-white/[0.02] border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                          <Clock className="w-3 h-3 mr-2 text-white/20"/> {formatDistanceToNow(new Date(latestDeployment.created_at))} ago
                        </Badge>
                     </div>
                  </div>
                  
                  <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center gap-4 group/msg hover:border-white/10 transition-all">
                     <div className="h-10 w-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0">
                       <Workflow className="w-5 h-5 text-white/20" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest mb-0.5">Change Summary</p>
                        <p className="text-xs text-white/60 font-medium truncate italic">{latestDeployment?.summary?.split('] ').pop() || 'No description provided.'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-24 border border-dashed border-white/5 rounded-3xl text-center flex flex-col items-center justify-center bg-white/[0.01] space-y-6 mb-12">
             <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <Layers className="w-8 h-8 text-white/5" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No active deployments</h3>
                <p className="text-xs text-white/20 max-w-sm mx-auto uppercase font-bold tracking-widest">Connect a repository to automate your infrastructure.</p>
             </div>
             <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} className="bg-white text-black h-11 px-8 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all">Setup Deployment</Button>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

            {/* Main Content */}
            <div className="xl:col-span-8 space-y-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <div className="flex items-center gap-8">
                      <button 
                        className={cn("text-xs font-bold uppercase tracking-widest pb-4 -mb-[17px] border-b-2 transition-all", fleetTab === 'production' ? "text-white border-white" : "text-white/20 border-transparent hover:text-white/40")}
                        onClick={() => setFleetTab('production')}
                      >
                        Production
                      </button>
                      <button 
                        className={cn("text-xs font-bold uppercase tracking-widest pb-4 -mb-[17px] border-b-2 transition-all", fleetTab === 'preview' ? "text-white border-white" : "text-white/20 border-transparent hover:text-white/40")}
                        onClick={() => setFleetTab('preview')}
                      >
                        Previews
                      </button>
                   </div>
                   <button className="text-[10px] font-bold uppercase tracking-widest text-white/10 hover:text-white transition-colors">History</button>
                </div>

                <div className="space-y-3">
                   {latestDeployment && fleetTab === 'production' ? (
                     <>
                        {(activity || []).filter((a: any) => a.action.includes('DEPLOY')).length > 0 ? (
                           activity.filter((a: any) => a.action.includes('DEPLOY')).slice(0, 5).map((dep: any, i: number) => (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.05 }}
                               key={dep.id} 
                               className={cn(
                                 "px-6 py-5 rounded-2xl flex items-center justify-between group transition-all border", 
                                 i === 0 
                                   ? "bg-white/[0.02] border-white/10 shadow-lg" 
                                   : "bg-transparent border-white/5 hover:bg-white/[0.01] hover:border-white/10"
                               )}
                             >
                                <div className="flex items-center gap-6 min-w-0">
                                   <div className={cn(
                                     "p-2.5 rounded-xl border transition-all",
                                     i === 0 ? "bg-white/[0.05] border-white/20 text-white" : "bg-white/[0.01] border-white/5 text-white/10 group-hover:text-white/30"
                                   )}>
                                      <GitCommit className="w-5 h-5" />
                                   </div>
                                   <div className="min-w-0 pt-0.5">
                                      <p className="text-[13px] font-bold uppercase tracking-tight text-white/80 truncate group-hover:text-white transition-colors">{dep.details?.message || dep.action.replace(/_/g, ' ')}</p>
                                      <div className="flex items-center gap-4 text-[9px] text-white/10 font-bold uppercase tracking-widest mt-1">
                                         <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> {dep.details?.branch || 'main'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/5" />
                                         <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> {dep.details?.commit?.slice(0, 7) || '---'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/5" />
                                         <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(dep.created_at))} ago</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-6">
                                   {i === 0 && (
                                     <Badge variant="outline" className="px-2 py-0.5 bg-emerald-500/5 border-emerald-500/10 text-emerald-400 font-bold tracking-widest text-[8px] uppercase">Active</Badge>
                                   )}
                                   <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-white transition-all" />
                                </div>
                             </motion.div>
                           ))
                        ) : (
                           <div className="px-6 py-6 rounded-2xl flex items-center justify-between group bg-white/[0.02] border border-white/10 shadow-lg">
                             <div className="flex items-center gap-6 min-w-0">
                                <div className="p-2.5 rounded-xl bg-white/[0.05] border-white/20 text-white">
                                   <GitCommit className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                   <p className="text-[13px] font-bold uppercase text-white/80 truncate">{latestDeployment?.summary || 'Project Synchronized'}</p>
                                   <div className="flex items-center gap-4 text-[9px] text-white/10 font-bold uppercase tracking-widest mt-1">
                                      <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> {latestDeployment?.branch || 'main'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/5" />
                                      <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> {latestDeployment?.commit?.slice(0, 7) || '---'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/5" />
                                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(latestDeployment?.created_at))} ago</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <Badge variant="outline" className="px-2 py-0.5 bg-emerald-500/5 border-emerald-500/10 text-emerald-400 font-bold tracking-widest text-[8px] uppercase">Active</Badge>
                                <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-white transition-all" />
                             </div>
                          </div>
                        )}
                     </>
                   ) : (
                      <div className="py-32 border border-dashed border-white/5 rounded-3xl text-center flex flex-col items-center justify-center bg-white/[0.01] space-y-6 group">
                         <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <Workflow className="w-8 h-8 text-white/5 group-hover:text-white/10 transition-colors" />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/20">Empty Deck</h3>
                            <p className="text-[10px] text-white/10 uppercase font-medium tracking-widest max-w-xs leading-relaxed mx-auto">Create a Pull Request to initialize a transient environment.</p>
                         </div>
                      </div>
                   )}
                </div>
            </div>

            {/* Side Column */}
            <div className="xl:col-span-4 space-y-8">

                {/* Status Card */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                   <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 opacity-40" /> Cluster Alignment
                      </h3>
                      {latestDeployment && <button onClick={() => driftQuery.refetch()} className="text-white/10 hover:text-white transition-colors"><RefreshCw className={cn("w-3.5 h-3.5", driftQuery.isFetching && "animate-spin")} /></button>}
                   </div>
                   <div className="p-6">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-4 p-4 border border-dashed border-white/5 rounded-2xl text-white/10">
                            <RefreshCw className="w-4 h-4 opacity-50" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Waiting for initial build...</span>
                         </div>
                      ) : driftQuery.isLoading ? (
                         <div className="flex items-center gap-4 p-4">
                            <RefreshCw className="w-4 h-4 animate-spin text-white/10" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/10">Scanning state...</span>
                         </div>
                      ) : driftQuery.data?.hasDrift ? (
                         <div className="space-y-4">
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                               <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-1">Drift Detected</h4>
                               <p className="text-[9px] text-red-500/20 font-medium italic">Cluster state diverged from source.</p>
                            </div>
                            <Button 
                              onClick={() => reconcileMutation.mutate({ deploymentId: latestDeployment?.id || ''})}
                              disabled={reconcileMutation.isLoading}
                              className="w-full h-10 bg-red-500 text-white hover:bg-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                            >
                               {reconcileMutation.isLoading ? 'Syncing...' : 'Fix Alignment'}
                            </Button>
                         </div>
                      ) : (
                         <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/40">Synchronized</span>
                         </div>
                      )}
                   </div>
                </div>

                {/* Scaling Card */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                   <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 opacity-40" /> Infrastructure Scaling
                      </h3>
                   </div>
                   <div className="p-6">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-4 p-4 border border-dashed border-white/5 rounded-2xl text-white/10">
                            <Sliders className="w-4 h-4 opacity-50" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Scaling locked until first deploy.</span>
                         </div>
                      ) : (
                         <div className="space-y-6">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-white/10">Instance Count</span>
                               <span className="text-sm font-bold text-white/60">{targetReplicas}</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" max="10" 
                              value={targetReplicas}
                              onChange={(e) => setTargetReplicas(parseInt(e.target.value))}
                              className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white hover:bg-white/10 transition-colors"
                            />
                            <Button 
                              onClick={() => scaleMutation.mutate({ deploymentId: latestDeployment?.id || '', replicas: targetReplicas })}
                              disabled={scaleMutation.isLoading}
                              className="w-full h-10 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                            >
                               {scaleMutation.isLoading ? 'Updating...' : 'Update Replicas'}
                            </Button>
                         </div>
                      )}
                   </div>
                </div>

                {/* Tools Card */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-xl space-y-3">
                    <button 
                      onClick={() => exportMutation.mutate({ projectId: project.id })}
                      className="w-full p-4 bg-white/[0.01] border border-white/5 rounded-2xl group flex items-center gap-4 hover:bg-white/[0.03] transition-all"
                    >
                       <Code className="w-4 h-4 text-white/10 group-hover:text-white/40" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40">Download Terraform</span>
                    </button>
                    <button 
                      onClick={() => router.push(`/projects/${projectSlug}/addons`)}
                      className="w-full p-4 bg-white/[0.01] border border-white/5 rounded-2xl group flex items-center gap-4 hover:bg-white/[0.03] transition-all"
                    >
                       <Layers className="w-4 h-4 text-white/10 group-hover:text-emerald-500/40" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40">Marketplace</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </AppShell>
  )
}
