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
    <AppShell title={
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-inset ring-white/[0.01]">
          <Layers className="w-6 h-6 text-indigo-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-black tracking-[0.5em] uppercase text-foreground/90">{project.name}_NODE</span>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
            Infrastructure_Protocol // {project.slug?.toUpperCase()}
          </span>
        </div>
      </div>
    }>
      <div className="flex-1 p-10 lg:p-14 max-w-[1700px] mx-auto w-full animate-in fade-in duration-1000 space-y-16">
        <ToastContainer />

        {/* TOP HERO: The Latest Deployment Manifest */}
        {latestDeployment ? (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-emerald-500/[0.03] blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
            
            <div className="px-10 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/80">Active Deployment Protocol</span>
               </div>
               <div className="flex items-center gap-4">
                 <button onClick={() => router.push(`/projects/${projectSlug}/logs`)} className="h-9 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground border border-white/5 bg-white/[0.02] rounded-xl transition-all">Telemetry Logs</button>
                 <button onClick={() => addToast({title: "Rollback", description: "Rollback API stubbed.", type: "info"})} className="h-9 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/40 hover:text-amber-400 border border-amber-500/10 bg-amber-500/5 rounded-xl transition-all">State Rollback</button>
               </div>
            </div>
            
            <div className="p-10 flex flex-col xl:flex-row items-center gap-12">
               <div className="w-full xl:w-[480px] aspect-[16/9] bg-[#050505] border border-white/5 rounded-3xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl shrink-0" onClick={handleVisit}>
                  <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-colors duration-700" />
                  <Globe className="w-12 h-12 text-white/5 group-hover:text-white/10 group-hover:scale-110 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end justify-center pb-8 p-10">
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 border border-white/10 px-8 py-4 rounded-full bg-black/40 backdrop-blur-md">UPLINK_ESTABLISH <ExternalLink className="w-4 h-4"/></span>
                  </div>
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col justify-center space-y-8 h-full">
                  <div className="space-y-4">
                     <h2 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-indigo-400 transition-colors duration-700 cursor-pointer flex items-center gap-4" onClick={handleVisit}>
                        {latestDeployment?.services?.[0]?.url?.replace('https://', '')?.toUpperCase() || `${project.slug.toUpperCase()}.SARGE.DEV`}
                     </h2>
                     <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl">
                          <GitBranch className="w-3.5 h-3.5 text-indigo-400/60"/> 
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{latestDeployment.branch || 'main'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl font-mono">
                          <GitCommit className="w-3.5 h-3.5 text-emerald-400/60"/> 
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{latestDeployment.commit?.slice(0,7) || 'LATEST'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-amber-400/60"/> 
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{formatDistanceToNow(new Date(latestDeployment.created_at)).toUpperCase()} AGO</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center gap-6 group/msg hover:border-white/10 transition-all duration-700">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                       <Workflow className="w-6 h-6 text-indigo-400/60" />
                     </div>
                     <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Deployment Manifest Summary</p>
                        <p className="text-[12px] text-foreground/70 font-bold uppercase tracking-widest truncate">{latestDeployment?.summary?.split('] ').pop() || 'Initial synchronize via Nango Discovery Bridge.'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-48 border border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center justify-center bg-[#050505] space-y-10 group hover:border-white/10 transition-all duration-1000">
             <div className="w-24 h-24 rounded-[2rem] bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 bg-white/[0.01] blur-xl rounded-full animate-pulse" />
                <Layers className="w-12 h-12 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors duration-700 relative z-10" />
             </div>
             <div className="space-y-4">
                <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground/20 group-hover:text-foreground/40 transition-colors duration-700">Empty Infrastructure Vault</h3>
                <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-[0.2em] max-w-sm leading-relaxed group-hover:text-muted-foreground/20 transition-colors duration-700 mx-auto">Connect a GitHub identity registry to automatically initialize the deployment engine for this node.</p>
             </div>
             <Button onClick={() => router.push(`/projects/${projectSlug}/provision`)} className="bg-white text-black h-12 px-10 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-105">Initialize Engine Protocol</Button>
          </div>
        )}

        {/* SPLIT LAYOUT: Fleet vs Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

            {/* LEFT COLUMN: 70% The Deployment Fleet */}
            <div className="xl:col-span-8 space-y-10">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <div className="flex items-center gap-10">
                      <button 
                        className={cn("text-[11px] font-black uppercase tracking-[0.3em] pb-6 -mb-[26px] border-b-2 transition-all duration-700 relative", fleetTab === 'production' ? "text-foreground border-indigo-500" : "text-muted-foreground/20 border-transparent hover:text-muted-foreground/60")}
                        onClick={() => setFleetTab('production')}
                      >
                        Production Registry
                        {fleetTab === 'production' && <div className="absolute -bottom-0.5 left-0 right-0 h-4 bg-indigo-500/20 blur-xl rounded-full" />}
                      </button>
                      <button 
                        className={cn("text-[11px] font-black uppercase tracking-[0.3em] pb-6 -mb-[26px] border-b-2 transition-all duration-700 relative", fleetTab === 'preview' ? "text-foreground border-indigo-500" : "text-muted-foreground/20 border-transparent hover:text-muted-foreground/60")}
                        onClick={() => setFleetTab('preview')}
                      >
                        Preview Manifests
                        {fleetTab === 'preview' && <div className="absolute -bottom-0.5 left-0 right-0 h-4 bg-indigo-500/20 blur-xl rounded-full" />}
                      </button>
                   </div>
                   <button className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-foreground transition-colors">Manifest History</button>
                </div>

                <div className="space-y-4">
                   {latestDeployment && fleetTab === 'production' ? (
                     <>
                        {activity.filter((a: any) => a.action.includes('DEPLOY')).length > 0 ? (
                           activity.filter((a: any) => a.action.includes('DEPLOY')).slice(0, 6).map((dep: any, i: number) => (
                             <div key={dep.id} className={cn(
                               "px-8 py-6 rounded-3xl flex items-center justify-between group transition-all duration-700 border ring-1 ring-inset", 
                               i === 0 
                                 ? "bg-white/[0.02] border-indigo-500/30 ring-white/[0.02] shadow-2xl" 
                                 : "bg-transparent border-white/5 ring-white/[0.01] hover:bg-white/[0.01] hover:border-white/10"
                             )}>
                                <div className="flex items-center gap-8 min-w-0">
                                   <div className={cn(
                                     "p-3 rounded-2xl border transition-all duration-700",
                                     i === 0 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/[0.02] border-white/5 text-muted-foreground/20 group-hover:text-muted-foreground/40"
                                   )}>
                                      <GitCommit className="w-5 h-5" />
                                   </div>
                                   <div className="min-w-0 space-y-1.5">
                                      <p className="text-[13px] font-black uppercase tracking-widest text-foreground/80 truncate group-hover:text-foreground transition-colors">{dep.details?.message || dep.action.replace(/_/g, ' ')}</p>
                                      <div className="flex items-center gap-6 text-[9px] text-muted-foreground/20 font-black uppercase tracking-[0.2em] group-hover:text-muted-foreground/40 transition-colors">
                                         <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> {dep.details?.branch || 'main'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/5" />
                                         <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> {dep.details?.commit?.slice(0,7) || '---'}</span>
                                         <span className="w-1 h-1 rounded-full bg-white/5" />
                                         <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(dep.created_at)).toUpperCase()} AGO</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-8">
                                   {i === 0 && (
                                     <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400/60">LIVE_STATE</span>
                                     </div>
                                   )}
                                   <ChevronRight className="w-5 h-5 text-muted-foreground/10 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-700" />
                                </div>
                             </div>
                           ))
                        ) : (
                           <div className="px-8 py-8 rounded-3xl flex items-center justify-between group bg-white/[0.02] border border-white/10 ring-1 ring-inset ring-white/[0.02] shadow-2xl">
                             <div className="flex items-center gap-8 min-w-0">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                   <GitCommit className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 space-y-1.5">
                                   <p className="text-[13px] font-black uppercase tracking-widest text-foreground/80 truncate">{latestDeployment?.summary || 'INITIAL_NODE_SIGNAL'}</p>
                                   <div className="flex items-center gap-6 text-[9px] text-muted-foreground/20 font-black uppercase tracking-[0.2em]">
                                      <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> {latestDeployment?.branch || 'main'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/5" />
                                      <span className="flex items-center gap-1.5"><Code className="w-3 h-3" /> {latestDeployment?.commit?.slice(0,7) || '---'}</span>
                                      <span className="w-1 h-1 rounded-full bg-white/5" />
                                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(latestDeployment?.created_at)).toUpperCase()} AGO</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400/60">LIVE_STATE</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground/10 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-700" />
                             </div>
                          </div>
                        )}
                     </>
                   ) : (
                      <div className="py-32 border border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center justify-center bg-[#050505] space-y-10 group hover:border-white/10 transition-all duration-1000">
                         <div className="w-20 h-20 rounded-[1.5rem] bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl relative">
                            <Workflow className="w-10 h-10 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors duration-700" />
                         </div>
                         <div className="space-y-4">
                            <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground/20 group-hover:text-foreground/40 transition-colors duration-700">Ephemeral Deck Empty</h3>
                            <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-[0.2em] max-w-sm leading-relaxed mx-auto">Initialize a Pull Request stream to trigger automatic preview environment manifests.</p>
                         </div>
                      </div>
                   )}
                </div>
            </div>

            {/* RIGHT COLUMN: 30% Scale & Infrastructure Controls */}
            <div className="xl:col-span-4 space-y-10">

                {/* GitOps Synchronizer Status Panel */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col ring-1 ring-inset ring-white/[0.01]">
                   <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4">
                        <Lock className="w-4 h-4 text-indigo-400/40" /> GitOps Reconciler
                      </h3>
                      {latestDeployment && <button onClick={() => driftQuery.refetch()} className="text-muted-foreground/20 hover:text-white transition-colors"><RefreshCw className={cn("w-4 h-4", driftQuery.isFetching && "animate-spin")} /></button>}
                   </div>
                   <div className="p-8 flex flex-col space-y-8">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-6 p-6 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                            <RefreshCw className="w-5 h-5 text-muted-foreground/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Registry Offline...</span>
                         </div>
                      ) : driftQuery.isLoading ? (
                         <div className="flex items-center gap-6 p-6 bg-white/[0.01] border border-white/5 animate-pulse rounded-3xl">
                            <RefreshCw className="w-5 h-5 text-indigo-500/40 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Analyzing Live State Pool...</span>
                         </div>
                      ) : driftQuery.data?.hasDrift ? (
                         <>
                           <div className="flex items-start gap-6 p-8 bg-red-500/[0.02] border border-red-500/10 rounded-[2rem] relative overflow-hidden ring-1 ring-inset ring-red-500/[0.05]">
                              <div className="w-2.5 h-2.5 mt-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] shrink-0 animate-pulse" />
                              <div className="space-y-4">
                                 <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-red-400">Drift Anomaly Detected</h4>
                                 <p className="text-[9px] font-bold text-red-500/40 uppercase tracking-widest leading-relaxed">Infrastructure mismatch between VCS manifest and runtime environment.</p>
                                 <div className="mt-6 bg-black/40 border border-red-500/10 rounded-2xl p-6 text-[10px] font-black font-mono space-y-3">
                                   <div className="flex items-center justify-between text-red-500/20">
                                      <span>EXPECTED_UNITS</span>
                                      <span>{driftQuery.data.driftDetails?.expected?.replicas}</span>
                                   </div>
                                   <div className="flex items-center justify-between text-red-400">
                                      <span>ACTUAL_DETECTION</span>
                                      <span>{driftQuery.data.driftDetails?.actual?.replicas}</span>
                                   </div>
                                 </div>
                              </div>
                           </div>
                           <Button 
                             onClick={() => reconcileMutation.mutate({ deploymentId: latestDeployment?.id || ''})}
                             disabled={reconcileMutation.isLoading}
                             className="w-full h-14 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_40px_rgba(239,68,68,0.2)] transition-all hover:scale-[1.02]"
                           >
                              {reconcileMutation.isLoading ? 'RECONCILING...' : 'RECONCILE_STATE_NOW'}
                           </Button>
                         </>
                      ) : (
                         <div className="flex gap-8 items-center p-8 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-[2rem] ring-1 ring-inset ring-emerald-500/[0.05]">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                               <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div className="space-y-1.5">
                               <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Synchronized</h4>
                               <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">GitOps Integrity 100% Verified.</p>
                            </div>
                         </div>
                      )}
                   </div>
                </div>

                {/* Infrastructure Fleet Scaler */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col ring-1 ring-inset ring-white/[0.01]">
                   <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4">
                        <Sliders className="w-4 h-4 text-emerald-400/40" /> Fleet Scaling Protocols
                      </h3>
                   </div>
                   <div className="p-8 flex flex-col space-y-10">
                      {!latestDeployment ? (
                         <div className="flex items-center gap-6 p-6 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                            <Sliders className="w-5 h-5 text-muted-foreground/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Protocols Inactive...</span>
                         </div>
                      ) : (
                         <>
                            <div className="space-y-6">
                              <div className="flex justify-between items-end mb-4">
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Target Replicas</span>
                                 <div className="flex items-center gap-4 bg-white/[0.03] px-5 py-2 rounded-xl border border-white/5">
                                    <span className="text-[14px] font-black font-mono text-indigo-400">{targetReplicas}</span>
                                    <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">NODES</span>
                                 </div>
                              </div>
                              <input 
                                type="range" 
                                min="1" max="100" 
                                value={targetReplicas}
                                onChange={(e) => setTargetReplicas(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                              />
                              <div className="flex justify-between text-[8px] text-muted-foreground/10 font-black uppercase tracking-[0.4em] pt-2">
                                 <span>min_1</span>
                                 <span>fleet_avg_50</span>
                                 <span>max_100</span>
                              </div>
                           </div>
                           <Button 
                             onClick={() => scaleMutation.mutate({ deploymentId: latestDeployment?.id || '', replicas: targetReplicas })}
                             disabled={scaleMutation.isLoading}
                             className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02]"
                           >
                              {scaleMutation.isLoading ? 'SCALING_FLEET...' : 'APPLY_SCALE_POLICY'}
                           </Button>
                         </>
                      )}
                   </div>
                </div>

                {/* Platform Tools Protocols */}
                <div className="space-y-6">
                  <div className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 border-b border-white/5 pb-4">Platform Extensions</div>
                  
                  <div className="grid grid-cols-2 gap-6">
                     <button 
                       className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-indigo-500/20 hover:bg-white/[0.02] transition-all duration-700 group flex flex-col gap-6 text-left ring-1 ring-inset ring-white/[0.01]"
                       onClick={() => exportMutation.mutate({ projectId: projectSlug })}
                     >
                       <Code className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
                       <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">Eject_Terraform</span>
                     </button>
                     
                     <button 
                       className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-emerald-500/20 hover:bg-white/[0.02] transition-all duration-700 group flex flex-col gap-6 text-left ring-1 ring-inset ring-white/[0.01]"
                       onClick={() => router.push(`/projects/${projectSlug}/addons`)}
                     >
                       <Layers className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-700" />
                       <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">Mesh_Addons</span>
                     </button>
                  </div>
                </div>

            </div>

        </div>

      </div>
    </AppShell>
  )
}
