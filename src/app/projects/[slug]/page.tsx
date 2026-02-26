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

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  
  const projectSlug = params.slug
  const [fleetTab, setFleetTab] = useState<'production' | 'preview'>('production')
  const [targetReplicas, setTargetReplicas] = useState(2)

  // Consolidated Data Fetching
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000, refetchOnWindowFocus: false }
  )
  
  const project = dashboardQuery.data?.project
  const activity = dashboardQuery.data?.activity || []
  const latestDeployment = (dashboardQuery.data as any)?.latestDeployment

  // Kubernetes Enterprise Levers
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
      addToast({ title: 'GitOps Reconciled', description: 'Drift remediation complete. Cluster matches IaC.', type: 'success' })
      driftQuery.refetch()
    },
    onError: (e) => addToast({ title: 'Reconciliation Failed', description: e.message, type: 'error' })
  })

  const exportMutation = trpc.export.exportToTerraform.useMutation({
    onMutate: () => addToast({ title: "Exporting...", description: "Ejecting blueprint to Terraform", type: "info" }),
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
            <p className="text-muted-foreground mt-2">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
            <Button variant="outline" className="mt-6" onClick={() => router.push('/projects')}>
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
      addToast({ title: "URL Missing", description: "Deployment URL not available yet.", type: "warning" })
    }
  }

  return (
    <AppShell title={project.name}>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in bg-background">
        <ToastContainer />

        {/* TOP HERO: The Latest Deployment Banner */}
        {latestDeployment ? (
          <div className="mb-8 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/50">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 blur-[0.5px]" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Production Active</span>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white border border-white/5 bg-white/5" onClick={() => router.push(`/projects/${projectSlug}/logs`)}>Logs</Button>
                 <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 border border-white/5 bg-white/5" onClick={() => addToast({title: "Rollback", description: "Rollback API stubbed.", type: "info"})}>Rollback</Button>
               </div>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
               <div className="w-full md:w-64 aspect-video bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-inner shrink-0" onClick={handleVisit}>
                  <Globe className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">Visit Site <ExternalLink className="w-3 h-3"/></span>
                  </div>
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4">
                  <div className="flex flex-col space-y-1">
                     <h2 className="text-2xl font-bold tracking-tight text-white truncate hover:underline cursor-pointer" onClick={handleVisit}>
                        {latestDeployment?.services?.[0]?.url?.replace('https://', '') || `${project.slug}-deployment.sarge.dev`}
                     </h2>
                     <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5"/> {latestDeployment.branch || 'main'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1.5"><GitCommit className="w-3.5 h-3.5"/> {latestDeployment.commit?.slice(0,7) || 'latest'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> deployed {formatDistanceToNow(new Date(latestDeployment.created_at))} ago</span>
                     </div>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                     <div className="h-8 w-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                       <img src="https://github.com/github.png" alt="author" className="w-full h-full rounded object-cover opacity-80" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground font-medium truncate">{latestDeployment?.summary?.split('] ').pop() || 'Initial project synchronization via Nango Bridge.'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 border border-dashed border-border/50 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-zinc-950/30">
             <Layers className="w-10 h-10 text-muted-foreground/30 mb-4" />
             <h3 className="text-lg font-bold tracking-tight mb-2">No Deployments Found</h3>
             <p className="text-xs text-muted-foreground mb-6">Connect a GitHub repository or CLI to automatically build and deploy.</p>
             <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} className="bg-white text-black font-bold text-xs">Provision First Environment</Button>
          </div>
        )}

        {/* SPLIT LAYOUT: Fleet vs Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN: 70% The Deployment Fleet */}
            <div className="lg:col-span-8 space-y-6">
                
                <div className="flex items-center justify-between border-b border-border pb-2">
                   <div className="flex items-center gap-4">
                      <button 
                        className={cn("text-[11px] font-bold uppercase tracking-widest pb-2 -mb-[9px] border-b-2 transition-colors", fleetTab === 'production' ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-white")}
                        onClick={() => setFleetTab('production')}
                      >
                        Production Fleet
                      </button>
                      <button 
                        className={cn("text-[11px] font-bold uppercase tracking-widest pb-2 -mb-[9px] border-b-2 transition-colors", fleetTab === 'preview' ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-white")}
                        onClick={() => setFleetTab('preview')}
                      >
                        Preview Environments
                      </button>
                   </div>
                   <Button size="sm" variant="ghost" className="h-6 text-[10px] uppercase font-bold text-muted-foreground">View All</Button>
                </div>

                <div className="space-y-3">
                   {latestDeployment && fleetTab === 'production' ? (
                     <>
                        {activity.filter((a: any) => a.action.includes('DEPLOY')).length > 0 ? (
                           activity.filter((a: any) => a.action.includes('DEPLOY')).slice(0, 5).map((dep: any, i: number) => (
                             <div key={dep.id} className={cn("p-4 rounded-lg flex items-center justify-between group", i === 0 ? "bg-white/5 border border-white/10" : "bg-transparent border border-border hover:bg-white/[0.02]")}>
                                <div className="flex items-center gap-4 min-w-0">
                                   <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                                      <GitCommit className="w-4 h-4 text-indigo-400" />
                                   </div>
                                   <div className="min-w-0 space-y-1">
                                      <p className="text-sm font-medium truncate">{dep.details?.message || dep.action.replace(/_/g, ' ')}</p>
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                                         <span>{dep.details?.branch || 'main'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/20" />
                                         <span>{dep.details?.commit?.slice(0,7) || '---'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/20" />
                                         <span>{formatDistanceToNow(new Date(dep.created_at))} ago</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   {i === 0 && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase tracking-widest hidden sm:flex">Current</Badge>}
                                   <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-white transition-colors" />
                                </div>
                             </div>
                           ))
                        ) : (
                           <div className={cn("p-4 rounded-lg flex items-center justify-between group", "bg-white/5 border border-white/10")}>
                             <div className="flex items-center gap-4 min-w-0">
                                <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                                   <GitCommit className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                   <p className="text-sm font-medium truncate">{latestDeployment?.summary || 'Initial Deployment'}</p>
                                   <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                                      <span>{latestDeployment?.branch || 'main'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/20" />
                                      <span>{latestDeployment?.commit?.slice(0,7) || '---'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/20" />
                                      <span>{formatDistanceToNow(new Date(latestDeployment?.created_at))} ago</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase tracking-widest hidden sm:flex">Current</Badge>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-white transition-colors" />
                             </div>
                          </div>
                        )}
                     </>
                   ) : fleetTab === 'preview' ? (
                      <div className="py-12 border border-dashed border-border/50 rounded-lg text-center flex flex-col items-center p-8">
                         <Workflow className="w-8 h-8 text-muted-foreground/30 mb-3" />
                         <p className="text-sm font-medium text-foreground">No Active Previews</p>
                         <p className="text-[10px] text-muted-foreground mt-1 max-w-sm">Open a Pull Request on your connected repository to automatically provision an ephemeral preview environment.</p>
                      </div>
                   ) : null}
                </div>
            </div>

            {/* RIGHT COLUMN: 30% Scale & Infrastructure Controls */}
            <div className="lg:col-span-4 space-y-6">

                {/* GitOps Synchronizer Status Panel */}
                <div className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-lg">
                   <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> GitOps Reconciler
                      </h3>
                      {latestDeployment && <button onClick={() => driftQuery.refetch()} className="text-muted-foreground hover:text-white"><RefreshCw className={cn("w-3 h-3", driftQuery.isFetching && "animate-spin")} /></button>}
                   </div>
                   <div className="p-5 flex flex-col space-y-5">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-3 text-sm text-foreground/50 border border-dashed border-white/10 rounded-lg p-4 bg-white/[0.02]">
                            <RefreshCw className="w-4 h-4 opacity-30" />
                            <span className="text-xs">Waiting for active deployment to begin monitoring...</span>
                         </div>
                      ) : driftQuery.isLoading ? (
                         <div className="flex items-center gap-3 text-sm text-foreground/50 animate-pulse"><RefreshCw className="w-4 h-4" /> Analyzing live cluster...</div>
                      ) : driftQuery.data?.hasDrift ? (
                         <>
                           <div className="flex items-start gap-3">
                              <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 ring-4 ring-red-500/20 shrink-0" />
                              <div>
                                 <h4 className="text-sm font-bold text-red-500">Drift Detected</h4>
                                 <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">The live cluster state differs from the Git source of truth. Manual edits were detected.</p>
                                 <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-400">
                                   <span className="opacity-50 line-through mr-2">Expect: {driftQuery.data.driftDetails?.expected?.replicas}</span>
                                   <span>Actual: {driftQuery.data.driftDetails?.actual?.replicas}</span>
                                 </div>
                              </div>
                           </div>
                           <Button 
                             onClick={() => reconcileMutation.mutate({ deploymentId: latestDeployment?.id || ''})}
                             disabled={reconcileMutation.isLoading}
                             className="w-full h-8 text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 rounded-lg pt-0.5"
                           >
                              {reconcileMutation.isLoading ? 'Reconciling...' : 'Reconcile State Now'}
                           </Button>
                         </>
                      ) : (
                         <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                               <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                               <h4 className="text-sm font-bold text-emerald-400 tracking-tight">Synchronized</h4>
                               <p className="text-[10px] text-muted-foreground tracking-wide mt-0.5">Cluster state matches Git repository.</p>
                            </div>
                         </div>
                      )}
                   </div>
                </div>

                {/* Infrastructure Fleet Scaler */}
                <div className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-lg">
                   <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5" /> Fleet Scaling
                      </h3>
                   </div>
                   <div className="p-5 flex flex-col space-y-6">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-3 text-sm text-foreground/50 border border-dashed border-white/10 rounded-lg p-4 bg-white/[0.02]">
                            <Sliders className="w-4 h-4 opacity-30" />
                            <span className="text-xs">Target inactive. Provision your first deployment to scale.</span>
                         </div>
                      ) : (
                         <>
                            <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-medium text-foreground">Target Replicas</span>
                            <span className="text-sm font-mono text-indigo-400 font-bold">{targetReplicas}</span>
                         </div>
                         <input 
                           type="range" 
                           min="1" max="100" 
                           value={targetReplicas}
                           onChange={(e) => setTargetReplicas(parseInt(e.target.value))}
                           className="w-full accent-indigo-500"
                         />
                         <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>1</span>
                            <span>10</span>
                            <span>100</span>
                         </div>
                      </div>
                      <Button 
                        onClick={() => scaleMutation.mutate({ deploymentId: latestDeployment?.id || '', replicas: targetReplicas })}
                        disabled={scaleMutation.isLoading}
                        variant="secondary"
                        className="w-full h-8 text-[10px] font-bold uppercase tracking-widest"
                      >
                         {scaleMutation.isLoading ? 'Applying Scale...' : 'Apply Scale Policy'}
                      </Button>
                    </>
                  )}
                   </div>
                </div>

                {/* Enterprise Extensions */}
                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Platform Tools</div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div 
                     className="bg-card border border-border rounded-lg p-3 hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col justify-between"
                     onClick={() => exportMutation.mutate({ projectId: projectSlug })}
                   >
                     <Code className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-bold text-foreground">Eject to Terraform</span>
                   </div>
                   
                   <div 
                     className="bg-card border border-border rounded-lg p-3 hover:border-emerald-500/50 transition-colors cursor-pointer group flex flex-col justify-between"
                     onClick={() => router.push(`/projects/${projectSlug}/addons`)}
                   >
                     <Layers className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-bold text-foreground">BYOC Add-ons</span>
                   </div>
                </div>

            </div>

        </div>

      </div>
    </AppShell>
  )
}
