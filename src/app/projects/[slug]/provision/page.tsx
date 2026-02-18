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
  Brain,
  Github,
  Link,
  FolderOpen,
  Search,
  Sparkles,
  Rocket,
  SearchCode,
  Terminal
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
        <LoadingScreen title="Syncing Project" subtitle="Analyzing orchestration targets..." />
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-6 animate-pulse" />
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Project not found</h1>
          <p className="text-muted-foreground mt-4 max-w-md">The project you're looking for doesn't exist or you don't have access to this orchestration context.</p>
          <Button variant="outline" className="mt-10 h-14 px-10 rounded-[28px] font-black uppercase tracking-widest text-[10px]" onClick={() => router.push('/projects')}>
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
      addToast({ type: 'success', title: 'Cluster Ignited', description: 'Environment blueprint is being provisioned.' })
      router.push(`/projects/${projectSlug}`)
    }
  })

  // --- Actions ---

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true)
    setCurrentStep('analysis')
    
    // AI Scan simulation with the user's requested specific message
    setTimeout(() => {
      setAiAnalysis({
        summary: "We've detected a specialized RAG based chatbot with transformer architecture. This system requires high-memory vector operations and a low-latency inference engine. We recommend a hybrid cloud strategy using GCP for compute and AWS for secure vector storage.",
        recommended: ['vercel-nextjs', 'gcp-cloud-run', 'aws-rds', 'aws-sagemaker', 'pinecone-vector', 'local-grafana']
      })
      setIsAnalyzing(false)
    }, 2500)
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
      name: `live-${Math.random().toString(36).substring(7)}`,
      type: 'production',
      providerId: sourceType === 'github' ? 'vercel' : 'local',
      region: 'us-east-1',
      services: selectedServices
    })
  }

  // --- Render Helpers ---

  const renderSourceStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cards are already shrunk by the previous change */}
        <SourceCard 
          id="github" 
          icon={<Github className="w-5 h-5" />} 
          title="GitHub Account" 
          desc="Seamless access to your private and public repositories." 
          active={sourceType === 'github'} 
          onClick={() => setSourceType('github')} 
        />
        <SourceCard 
          id="url" 
          icon={<Link className="w-5 h-5" />} 
          title="Remote Git URL" 
          desc="Import any public repository via HTTPS clone link." 
          active={sourceType === 'url'} 
          onClick={() => setSourceType('url')} 
        />
        <SourceCard 
          id="local" 
          icon={<FolderOpen className="w-5 h-5" />} 
          title="Local Filesystem" 
          desc="Synchronize code directly from your dev machine." 
          active={sourceType === 'local'} 
          onClick={() => setSourceType('local')} 
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sourceType}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          {sourceType === 'github' && (
            <div className="bg-card/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-4">
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Filter repositories..." 
                   className="w-full bg-background/50 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[11px] outline-none"
                   value={repoSearch}
                   onChange={(e) => setRepoSearch(e.target.value)}
                 />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {isLoadingRepos ? (
                    <div className="col-span-full py-10 flex flex-col items-center gap-2">
                       <Rocket className="w-6 h-6 text-foreground animate-bounce" />
                       <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Syncing GitHub...</p>
                    </div>
                  ) : filteredRepos.length > 0 ? filteredRepos.map(repo => (
                    <button 
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={cn(
                        "flex flex-col items-start p-3 border rounded-2xl transition-all text-left group",
                        selectedRepo?.id === repo.id 
                          ? "bg-foreground border-foreground shadow-md" 
                          : "bg-background/20 border-white/5 hover:border-white/10"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold truncate w-full", selectedRepo?.id === repo.id ? "text-background" : "text-foreground")}>{repo.name}</span>
                      <span className={cn("text-[8px] font-medium opacity-50", selectedRepo?.id === repo.id ? "text-background" : "text-muted-foreground")}>{repo.full_name.split('/')[0]}</span>
                    </button>
                  )) : (
                    <div className="col-span-full py-10 text-center">
                       <p className="text-[10px] font-bold text-muted-foreground">No repositories found.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {(sourceType === 'url' || sourceType === 'local') && (
            <div className="bg-card/20 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-xl">
               <div className="relative group">
                 <input 
                   type="text" 
                   placeholder={sourceType === 'url' ? "https://github.com/mysterix/super-rag.git" : "/Users/dev/projects/ai-chatbot"}
                   className="w-full bg-background border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono outline-none"
                   value={publicUrl}
                   onChange={(e) => setPublicUrl(e.target.value)}
                 />
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center">
        <Button 
          disabled={sourceType === 'github' ? !selectedRepo : !publicUrl}
          onClick={handleStartAnalysis}
          className="h-12 px-10 bg-foreground text-background font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group"
        >
          Initialize AI Engine <SearchCode className="w-4 h-4 group-hover:scale-110" />
        </Button>
      </div>
    </div>
  )

  const renderAnalysisStep = () => (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="relative p-10 bg-foreground text-background rounded-[48px] shadow-2xl overflow-hidden group">
         <div className="absolute top-[-30px] right-[-30px] p-6 opacity-5 group-hover:scale-110 transition-all duration-700">
           <Brain className="w-48 h-48" />
         </div>
         
         <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl">
               <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Neural Architecture Scan</h2>
              <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">Extracting Service Nodes</p>
            </div>
         </div>

         {isAnalyzing ? (
           <div className="space-y-4">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 2.5 }} className="h-full bg-white" />
              </div>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Activity className="w-3 h-3 animate-spin" /> Parsing project DNA...
              </p>
           </div>
         ) : (
           <div className="space-y-8 animate-in fade-in zoom-in-95">
             <p className="text-xl leading-tight font-black tracking-tight max-w-xl italic">
               "{aiAnalysis?.summary}"
             </p>
             <div className="pt-6 border-t border-white/10 flex justify-between items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Confidence</span>
                  <span className="text-2xl font-black text-emerald-400">98.2%</span>
                </div>
                <Button onClick={handleApplyAnalysis} className="bg-white text-black font-black px-8 py-6 rounded-2xl uppercase tracking-widest text-[11px] flex items-center gap-3 shadow-xl group">
                  Sync Blueprint <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
             </div>
           </div>
         )}
      </div>
    </div>
  )

  return (
    <AppShell title="Provision Infrastructure">
      <ToastContainer />
      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto w-full flex flex-col gap-6 overflow-hidden">
        
        {/* Compact Header & Progress */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
           <div className="space-y-1">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-[9px] font-black uppercase tracking-widest group"
              >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Project Details
              </button>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">Infrastructure Assembly</h1>
           </div>
           
           <div className="flex bg-muted/20 p-1 rounded-2xl border border-white/5 shadow-inner">
             {(['source', 'analysis', 'blueprint', 'ready'] as step[]).map((s, idx) => (
               <button 
                 key={s}
                 onClick={() => {
                   if (idx <= stepIndex(currentStep)) setCurrentStep(s)
                 }}
                 className={cn(
                   "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   currentStep === s 
                    ? "bg-foreground text-background shadow-lg" 
                    : idx < stepIndex(currentStep)
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-muted-foreground/30 cursor-not-allowed"
                 )}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
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
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-2 italic">
                         <Layers className="w-3 h-3" /> Architecture Blueprint
                       </h2>
                       <span className="text-[9px] text-muted-foreground font-black uppercase opacity-30 italic">{selectedServices.length} nodes isolated</span>
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
        "p-6 rounded-[32px] border-2 transition-all flex flex-col items-start text-left gap-4 group relative overflow-hidden",
        active 
          ? "bg-foreground border-foreground shadow-lg scale-[0.98]" 
          : "bg-card/20 border-white/5 hover:border-white/20 hover:bg-card/40"
      )}
    >
      <div className={cn(
        "p-3 rounded-2xl transition-all duration-700",
        active ? "bg-white/10 text-white" : "bg-muted text-muted-foreground"
      )}>
         {icon}
      </div>
      <div>
        <p className={cn("text-sm font-black uppercase tracking-tight", active ? "text-white" : "text-foreground")}>{title}</p>
        <p className={cn("text-[9px] font-medium leading-relaxed opacity-60", active ? "text-white" : "text-muted-foreground")}>{desc}</p>
      </div>
    </button>
  )
}

function ReadyStep({ selectedServices, onDeploy, isDeploying }: { selectedServices: string[], onDeploy: () => void, isDeploying: boolean }) {
  // Use the same service data to render icons in the final step
  // Note: Importing ALL_SERVICES or passing it down would be better. For now, we simplify but keep it rich.
  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none italic">Cluster Assembly</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Verify the orchestration matrix before initializing the deployment sequence across your linked cloud providers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="p-10 bg-card/20 backdrop-blur-2xl border border-white/5 rounded-[60px] space-y-10 shadow-3xl">
           <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground px-2 flex items-center justify-between">
              Target Infrastructure <span>{selectedServices.length} Nodes</span>
           </h3>
           <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
             {selectedServices.map(id => (
                 <div key={id} className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 group">
                    <div className="flex items-center gap-6">
                       <div className="p-4 bg-foreground text-background rounded-3xl group-hover:scale-110 transition-transform">
                         <Zap className="w-6 h-6" />
                       </div>
                       <div>
                         <p className="text-lg font-black tracking-tight italic">{id.replace(/-/g, ' ').toUpperCase()}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-40">Provisioning Unit</p>
                       </div>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 </div>
             ))}
           </div>
        </div>

        <div className="flex flex-col justify-center space-y-10">
           <div className="p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[60px] relative overflow-hidden backdrop-blur-md group">
             <div className="absolute top-[-20px] right-[-20px] p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
               <Zap className="w-32 h-32" />
             </div>
             <h3 className="text-2xl font-black text-indigo-400 mb-4 font-mono tracking-tighter italic">deploy_ignition.init()</h3>
             <p className="text-muted-foreground leading-relaxed text-lg">
               Final confirmation required. Sarge will now connect to the independent cloud controllers to provision security groups, compute instances, and networking routes.
             </p>
           </div>
           
           <Button 
            disabled={isDeploying}
            onClick={onDeploy}
            className="w-full py-20 bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-3xl tracking-tighter rounded-[60px] shadow-[0_50px_100px_-20px_rgba(255,255,255,0.05)] transition-all active:scale-[0.98] group relative overflow-hidden"
           >
             {isDeploying ? (
                <div className="flex items-center gap-4">
                   <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="p-2 bg-emerald-400 rounded-full" />
                   Initializing Cluster...
                </div>
             ) : (
               <>
                 <span className="relative z-10 italic">Awaken Cluster</span>
                 <Rocket className="relative z-10 ml-4 w-10 h-10 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
               </>
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
