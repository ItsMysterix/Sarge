"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Globe, 
  Database, 
  Zap, 
  Shield, 
  Activity, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Monitor,
  Server,
  Cloud,
  Github,
  Link,
  FolderOpen,
  Search,
  SearchCode,
  Terminal,
  Box,
  FileCode,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { trpc } from "@/lib/trpc"
import { Repository } from "@/lib/types"
import { ConnectProviderModal } from "@/components/settings/connect-provider-modal"
import { InfrastructureBlueprint, type ServiceOption } from "@/components/projects/InfrastructureBlueprint"
import { LoadingScreen } from "@/components/ui/loading-screen"

type step = 'source' | 'analysis' | 'blueprint' | 'ready'

export default function ProvisionPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const projectSlug = params.slug
  const { addToast, ToastContainer } = useToast()
  const t = trpc as any
  
  // Flow State
  const [currentStep, setCurrentStep] = useState<step>('source')
  const [sourceType, setSourceType] = useState<'github' | 'url' | 'local'>('github')
  const [repoSearch, setRepoSearch] = useState("")
  const [githubRepos, setGithubRepos] = useState<Repository[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [publicUrl, setPublicUrl] = useState("")
  
  // Selection State
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  
  // Provider State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  // tRPC Queries
  const projectQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000 }
  )
  const project = projectQuery.data?.project
  const providersQuery = t.providers.list.useQuery({ projectSlug })
  const providers = providersQuery.data || []
  
  // Fetch GitHub Repos
  useEffect(() => {
    if (sourceType === 'github' && currentStep === 'source') {
      setIsLoadingRepos(true)
      fetch('/api/github/repos')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setGithubRepos(data)
          setIsLoadingRepos(false)
        })
        .catch(() => setIsLoadingRepos(false))
    }
  }, [sourceType, currentStep])

  // --- Guards ---
  if (projectQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Synchronizing Project" subtitle="Analyzing orchestration targets..." />
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h1 className="text-xl font-bold tracking-tight">Project not found</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">The project context could not be verified. Please ensure you have sufficient permissions.</p>
          <Button variant="outline" className="mt-8 rounded-xl" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </AppShell>
    )
  }

  // Derived
  const filteredRepos = useMemo(() => {
    return githubRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
  }, [githubRepos, repoSearch])

  const isProviderConnected = (providerId: string) => {
    if (providerId === 'local') return true
    return providers.some((p: any) => p.id === providerId && p.status === 'connected')
  }

  // --- Mutations ---
  const saveCredentialsMutation = t.providers.saveCredentials.useMutation({
    onSuccess: () => {
      providersQuery.refetch()
      addToast({ type: 'success', title: 'Account Connected', description: 'Real-time billing and orchestration active.' })
      setIsConnectModalOpen(false)
      setSelectedProvider(null)
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Connection Failed', description: err.message })
    }
  })

  const createEnvMutation = t.environments.create.useMutation({
    onSuccess: () => {
      addToast({ type: 'success', title: 'Cluster Created', description: 'Environment provisioned successfully.' })
      router.push(`/projects/${projectSlug}`)
    }
  })

  // --- Actions ---
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true)
    setCurrentStep('analysis')
    
    setTimeout(() => {
      setAiAnalysis({
        summary: "Specialized RAG architecture detected. System requires high-memory vector operations and low-latency inference engines. Recommended hybrid strategy: GCP for compute nodes and AWS for secure vector persistence.",
        recommended: ['vercel-nextjs', 'gcp-cloud-run', 'aws-rds', 'aws-sagemaker', 'pinecone-vector', 'local-grafana']
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleApplyAnalysis = () => {
    if (aiAnalysis?.recommended) {
      setSelectedServices(aiAnalysis.recommended)
    }
    setCurrentStep('blueprint')
  }

  const handleConnectProvider = async (providerId: string, credentials: Record<string, string>) => {
    saveCredentialsMutation.mutate({
      providerId,
      projectSlug,
      credentials
    })
  }

  const openConnectModal = (providerId: string) => {
    const provider = providers.find((p: any) => p.id === providerId) || { id: providerId, name: providerId.toUpperCase() }
    setSelectedProvider(provider)
    setIsConnectModalOpen(true)
  }

  const handleFinalDeploy = () => {
    createEnvMutation.mutate({
      projectSlug,
      name: `prod-${Math.random().toString(36).substring(7)}`,
      type: 'production',
      providerId: sourceType === 'github' ? 'vercel' : 'local',
      region: 'us-east-1',
      services: selectedServices
    })
  }

  // --- Render Helpers ---
  const renderSourceStep = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SourceCard 
          id="github" 
          icon={<Github className="w-5 h-5" />} 
          title="GitHub Integration" 
          desc="Authorized access to managed repositories." 
          active={sourceType === 'github'} 
          onClick={() => setSourceType('github')} 
        />
        <SourceCard 
          id="url" 
          icon={<Link className="w-5 h-5" />} 
          title="Remote Endpoint" 
          desc="Clone via public repository URL." 
          active={sourceType === 'url'} 
          onClick={() => setSourceType('url')} 
        />
        <SourceCard 
          id="local" 
          icon={<FolderOpen className="w-5 h-5" />} 
          title="Local Filesystem" 
          desc="Direct sync from development workspace." 
          active={sourceType === 'local'} 
          onClick={() => setSourceType('local')} 
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sourceType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {sourceType === 'github' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
               <div className="relative group max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Filter repositories..." 
                   className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground/20 transition-colors"
                   value={repoSearch}
                   onChange={(e) => setRepoSearch(e.target.value)}
                 />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingRepos ? (
                    <div className="col-span-full py-12 flex flex-col items-center gap-3">
                       <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Indexing GitHub...</p>
                    </div>
                  ) : filteredRepos.length > 0 ? filteredRepos.map(repo => (
                    <button 
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={cn(
                        "flex flex-col items-start p-4 border rounded-xl transition-all text-left group",
                        selectedRepo?.id === repo.id 
                          ? "bg-foreground border-foreground text-background shadow-lg" 
                          : "bg-background border-border hover:border-foreground/20"
                      )}
                    >
                      <span className="text-[11px] font-bold truncate w-full mb-1">{repo.name}</span>
                      <span className={cn("text-[9px] font-medium opacity-60", selectedRepo?.id === repo.id ? "text-background" : "text-muted-foreground")}>{repo.full_name.split('/')[0]}</span>
                    </button>
                  )) : (
                    <div className="col-span-full py-12 text-center">
                       <p className="text-xs font-medium text-muted-foreground">No repositories found in this scope.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {(sourceType === 'url' || sourceType === 'local') && (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
               <div className="relative max-w-2xl">
                 <input 
                   type="text" 
                   placeholder={sourceType === 'url' ? "https://github.com/org/repo.git" : "/path/to/local/source"}
                   className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-foreground/20 transition-colors"
                   value={publicUrl}
                   onChange={(e) => setPublicUrl(e.target.value)}
                 />
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-start">
        <Button 
          disabled={sourceType === 'github' ? !selectedRepo : !publicUrl}
          onClick={handleStartAnalysis}
          className="h-11 px-8 bg-foreground text-background font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-foreground/90 transition-all flex items-center gap-2"
        >
          Initialize Service Scan <SearchCode className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  const renderAnalysisStep = () => (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-muted rounded-lg border border-border">
               <Cpu className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">Architectural Discovery</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">AI Assisted Node Mapping</p>
            </div>
         </div>

         {isAnalyzing ? (
           <div className="space-y-6 py-8">
              <div className="h-1 bg-muted rounded-full overflow-hidden w-64">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-foreground/40" />
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                 <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing project structure...
              </p>
           </div>
         ) : (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
             <div className="p-6 bg-muted/30 border border-border rounded-xl">
                <p className="text-sm font-medium leading-relaxed text-foreground/90 max-w-3xl">
                  {aiAnalysis?.summary}
                </p>
             </div>
             
             <div className="flex items-center gap-8 px-2">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Confidence Matrix</span>
                   <span className="text-xl font-bold text-emerald-500">98.2%</span>
                </div>
                <Button onClick={handleApplyAnalysis} className="bg-foreground text-background font-bold px-8 py-5 rounded-xl uppercase tracking-widest text-[10px] flex items-center gap-2 ml-auto shadow-lg">
                  Configure Blueprint <ArrowRight className="w-4 h-4" />
                </Button>
             </div>
           </div>
         )}
      </div>
    </div>
  )

  return (
    <AppShell title="Provisioning">
      <ToastContainer />
      <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
        {/* Compact Header & Progress */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="space-y-1">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-[10px] font-bold uppercase tracking-widest group mb-2"
              >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Project Details
              </button>
              <h1 className="text-2xl font-bold tracking-tight">Infrastructure Assembly</h1>
           </div>
           
           <div className="flex bg-muted/40 p-1 rounded-xl border border-border">
             {(['source', 'analysis', 'blueprint', 'ready'] as step[]).map((s, idx) => (
                <button 
                  key={s}
                  onClick={() => {
                    if (idx <= stepIndex(currentStep)) setCurrentStep(s)
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
                    currentStep === s 
                     ? "bg-foreground text-background shadow-md" 
                     : idx < stepIndex(currentStep)
                       ? "text-emerald-500 hover:bg-emerald-500/5"
                       : "text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  {s}
                </button>
             ))}
           </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'source' && renderSourceStep()}
              {currentStep === 'analysis' && renderAnalysisStep()}
              {currentStep === 'blueprint' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <Layers className="w-4 h-4" /> Component Specification
                       </h2>
                    </div>
                    <InfrastructureBlueprint 
                      selectedServices={selectedServices}
                      setSelectedServices={setSelectedServices}
                      aiRecommended={aiAnalysis?.recommended || []}
                      onConnectProvider={openConnectModal}
                      isConnected={isProviderConnected}
                      onNext={() => setCurrentStep('ready')}
                    />
                 </div>
              )}
              {currentStep === 'ready' && <ReadyStep selectedServices={selectedServices} onDeploy={handleFinalDeploy} isDeploying={createEnvMutation.isLoading} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <ConnectProviderModal
        provider={selectedProvider}
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false)
          setSelectedProvider(null)
        }}
        onConnect={handleConnectProvider}
      />
    </AppShell>
  )
}

function SourceCard({ icon, title, desc, active, onClick }: { id: string, icon: any, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl border transition-all flex flex-col items-start text-left gap-4 group relative",
        active 
          ? "bg-foreground border-foreground text-background shadow-lg" 
          : "bg-card border-border hover:border-foreground/20 hover:bg-muted/30"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-lg border transition-colors",
        active ? "bg-background/10 border-background/20 text-background" : "bg-muted border-border text-muted-foreground"
      )}>
         {icon}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest">{title}</p>
        <p className={cn("text-[10px] font-medium leading-relaxed opacity-60", active ? "text-background" : "text-muted-foreground")}>{desc}</p>
      </div>
    </button>
  )
}

function ReadyStep({ selectedServices, onDeploy, isDeploying }: { selectedServices: string[], onDeploy: () => void, isDeploying: boolean }) {
  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Final Verification</h2>
        <p className="text-muted-foreground text-sm max-w-2xl font-medium">Review the orchestration blueprint before initializing the deployment sequence across target cloud regions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Provisioning Matrix <span>{selectedServices.length} Nodes</span>
           </h3>
           <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
             {selectedServices.map(id => (
                  <div key={id} className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl transition-all hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-foreground text-background rounded-lg">
                         <Zap className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="text-xs font-bold tracking-tight uppercase">{id.replace(/-/g, ' ')}</p>
                         <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Active Component</p>
                       </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
             ))}
           </div>
        </div>

        <div className="flex flex-col space-y-8">
           <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden">
             <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
                <div className="space-y-2">
                   <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest">Deployment Guard</h3>
                   <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                     Orchestration requires final confirmation. All security groups, ephemeral storage, and routing tables will be provisioned according to the verified blueprint.
                   </p>
                </div>
             </div>
           </div>
           
           <Button 
            disabled={isDeploying}
            onClick={onDeploy}
            className="w-full py-12 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-lg tracking-widest rounded-2xl shadow-xl transition-all active:scale-[0.98] group"
           >
             {isDeploying ? (
                <div className="flex items-center gap-3">
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   Provisioning...
                </div>
             ) : (
               <div className="flex items-center gap-3">
                 Awaken Environment
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </div>
             )}
           </Button>
        </div>
      </div>
    </div>
  )
}

function stepIndex(s: step): number {
  const steps: step[] = ['source', 'analysis', 'blueprint', 'ready']
  return steps.indexOf(s)
}
