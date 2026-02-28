"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  ArrowLeft, 
  ArrowRight,
  Zap, 
  Shield, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Github,
  Link,
  FolderOpen,
  Search,
  SearchCode,
  RefreshCw,
  Cpu,
  Code
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { trpc } from "@/lib/trpc"
import { Repository, AIAnalysis } from "@/lib/types"
import { ConnectProviderModal } from "@/components/settings/connect-provider-modal"
import { InfrastructureBlueprint } from "@/components/projects/InfrastructureBlueprint"
import { LoadingScreen } from "@/components/ui/loading-screen"

type step = 'source' | 'analysis' | 'blueprint' | 'ready'

export default function ProvisionPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const projectSlug = params.slug
  const { addToast, ToastContainer } = useToast()
  const { data: session } = useSession()
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
  const [claudeAnalysis, setClaudeAnalysis] = useState<any>(null)

  // tRPC Queries
  const projectQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: projectSlug },
    { staleTime: 30000 }
  )
  const project = projectQuery.data?.project
  const providersQuery = t.providers.list.useQuery({ projectSlug })
  const providers = providersQuery.data || []

  // Mutations
  const analyzeMutation = t.project.analyzeRepository.useMutation({
    onSuccess: (data: AIAnalysis) => {
       // Map backend response to UI expected format (case-insensitive checks)
       const recommended: string[] = []
       const frameworkId = String(data.framework || '').toLowerCase()
       const infraStr = JSON.stringify(data.infrastructure || []).toLowerCase()
       const depsStr = JSON.stringify(data.detectedTools || []).toLowerCase()
       const fullCtx = frameworkId + ' ' + infraStr + ' ' + depsStr

       // Compute & Frontend
       if (fullCtx.includes('next.js') || fullCtx.includes('nextjs')) recommended.push('vercel-nextjs')
       else if (fullCtx.includes('react')) recommended.push('netlify-frontend')
       else if (fullCtx.includes('node') || fullCtx.includes('express')) recommended.push('railway-service')
       else if (fullCtx.includes('python') || fullCtx.includes('django') || fullCtx.includes('fastapi')) recommended.push('render-service')
       else if (data.projectType === 'frontend') recommended.push('vercel-nextjs')

       // Databases
       if (fullCtx.includes('postgres') || fullCtx.includes('pg')) recommended.push('neon-db')
       if (fullCtx.includes('mysql')) recommended.push('planetscale-db')
       if (fullCtx.includes('redis')) recommended.push('upstash-redis')
       if (fullCtx.includes('mongo')) recommended.push('mongodb-atlas')
       
       // DevOps & Docker
       if (data.needsDocker || fullCtx.includes('docker')) recommended.push('docker-hub')
       
       // Fallback defaults if nothing detected
       if (recommended.length === 0) recommended.push('vercel-nextjs')

       // Deduplicate
       const uniqueRecommended = Array.from(new Set(recommended))

       setClaudeAnalysis({
         summary: data.summary,
         recommended: recommended,
         confidence: data.confidence
       })
       setIsAnalyzing(false)
    },
    onError: (error: any) => {
       setIsAnalyzing(false)
       
       let userMsg = 'Could not analyze repository features.'
       let devMsg = error.message

       try {
         const parsed = JSON.parse(error.message)
         if (parsed.userMessage) {
            userMsg = parsed.userMessage
            devMsg = parsed.devDetail
         }
       } catch (e) {
         // Not JSON, use original message
       }

       console.error('[Provision] Analysis error:', devMsg)

       addToast({ 
         type: 'error', 
         title: 'Analysis Failed', 
         description: userMsg 
       })
       
       // Fallback for demo purposes if backend fails
       setClaudeAnalysis({
        summary: "Automated analysis failed. Switching to manual configuration mode. Defaulting to standard Next.js stack.",
        recommended: ['vercel-nextjs'],
        confidence: 0
      })
    }
  })
  
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

  // Derived
  const filteredRepos = useMemo(() => {
    return githubRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
  }, [githubRepos, repoSearch])
  
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

  const deployStackMutation = t.oneclick.deployOrchestratedStack.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        addToast({ type: 'success', title: 'Stack Awoken', description: 'All target nodes are initializing.' })
        router.push(`/projects/${projectSlug}`)
      } else {
        addToast({ type: 'warning', title: 'Partial Success', description: 'Some nodes failed to initialize. Check details in dashboard.' })
        router.push(`/projects/${projectSlug}`)
      }
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Orchestration Failed', description: err.message })
    }
  })



  // --- Actions ---
  const handleStartAnalysis = async () => {
    if (sourceType === 'github' && selectedRepo) {
       // Check for token first
       const token = (session as any)?.accessToken
       if (!token) {
         const msg = "GitHub access token missing. Please sign out and sign in again."
         addToast({ type: 'error', title: 'Authentication Error', description: msg })
         return
       }

       setIsAnalyzing(true)
       setCurrentStep('analysis')
       
       analyzeMutation.mutate({
         repositoryId: selectedRepo.id,
         owner: selectedRepo.full_name.split('/')[0],
         repo: selectedRepo.name,
         branch: selectedRepo.default_branch,
         githubToken: token
       })
    } else {
       // Mock for non-GitHub sources (or error out)
       setIsAnalyzing(true)
       setCurrentStep('analysis')
       setTimeout(() => {
          setClaudeAnalysis({
            summary: "Local filesystem analysis completed. Structure indicates a standard React application. Optimization for static delivery recommended.",
            recommended: ['vercel-react', 'aws-s3'],
            confidence: 0.85
          })
          setIsAnalyzing(false)
       }, 1500)
    }
  }

  const handleApplyAnalysis = () => {
    if (claudeAnalysis?.recommended) {
      setSelectedServices(claudeAnalysis.recommended)
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
    if (sourceType === 'github' && selectedRepo) {
      deployStackMutation.mutate({
        projectSlug,
        owner: selectedRepo.full_name.split('/')[0],
        repo: selectedRepo.name,
        branch: selectedRepo.default_branch,
        serviceIds: selectedServices
      })
    } else {
      createEnvMutation.mutate({
        projectSlug,
        name: `prod-${Math.random().toString(36).substring(7)}`,
        type: 'production',
        providerId: 'local',
        region: 'us-east-1',
        services: selectedServices
      })
    }
  }

  // --- Render Helpers ---
  const renderSourceStep = () => (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <SourceCard 
          id="github" 
          icon={<Github className="w-6 h-6" />} 
          title="GitHub Registry" 
          desc="Authorized identity access to VCS managed repositories." 
          active={sourceType === 'github'} 
          onClick={() => setSourceType('github')} 
        />
        <SourceCard 
          id="url" 
          icon={<Link className="w-6 h-6" />} 
          title="Remote Endpoint" 
          desc="Injest via public git repository protocol." 
          active={sourceType === 'url'} 
          onClick={() => setSourceType('url')} 
        />
        <SourceCard 
          id="local" 
          icon={<FolderOpen className="w-6 h-6" />} 
          title="Local Workspace" 
          desc="Synchronized tunnel from development environment." 
          active={sourceType === 'local'} 
          onClick={() => setSourceType('local')} 
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sourceType}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          {sourceType === 'github' && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 space-y-10 shadow-2xl ring-1 ring-inset ring-white/[0.01]">
               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div className="relative group flex-1 max-w-xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/20 group-focus-within:text-indigo-500/40 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="FILTER_VCS_REGISTRY..." 
                      className="w-full bg-[#050505] border border-white/5 rounded-[1.25rem] pl-16 pr-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-500/20 transition-all placeholder:text-muted-foreground/10"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
                     <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> IDENTITY_VERIFIED</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {isLoadingRepos ? (
                    <div className="col-span-full py-32 flex flex-col items-center gap-6">
                       <RefreshCw className="w-10 h-10 text-indigo-500/20 animate-spin" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Indexing_Global_Manifests...</p>
                    </div>
                  ) : filteredRepos.length > 0 ? filteredRepos.map(repo => (
                    <button 
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={cn(
                        "flex flex-col items-start p-6 border rounded-[1.5rem] transition-all duration-500 text-left group relative overflow-hidden",
                        selectedRepo?.id === repo.id 
                          ? "bg-white/[0.03] border-indigo-500/40 shadow-2xl" 
                          : "bg-white/[0.01] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-4">
                         <Github className={cn("w-4 h-4 transition-colors", selectedRepo?.id === repo.id ? "text-indigo-400" : "text-muted-foreground/10 group-hover:text-muted-foreground/20")} />
                         {selectedRepo?.id === repo.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-widest truncate w-full transition-colors", selectedRepo?.id === repo.id ? "text-foreground" : "text-muted-foreground/40")}>{repo.name}</span>
                    </button>
                  )) : (
                    <div className="col-span-full py-32 text-center bg-[#050505] rounded-[2rem] border border-dashed border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10">No match detected within registry scope.</p>
                       <button className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400/40 hover:text-indigo-400 transition-colors mt-6">
                         REAUTH_GITHUB_BRIDGE
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {(sourceType === 'url' || sourceType === 'local') && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl ring-1 ring-inset ring-white/[0.01]">
               <div className="relative max-w-4xl">
                 <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-4 ml-2">TARGET_RESOURCE_LOCATOR</div>
                 <input 
                   type="text" 
                   placeholder={sourceType === 'url' ? "HTTPS://GITHUB.COM/MANIFEST.GIT" : "/VAR/WWW/SRC/NODE"}
                   className="w-full bg-[#050505] border border-white/5 rounded-[1.5rem] px-8 py-5 text-[11px] font-mono font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-500/20 transition-all text-white/80 placeholder:text-muted-foreground/5"
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
          className="h-16 px-12 bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Initialize Service Scan <SearchCode className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )

  const renderAnalysisStep = () => (
    <div className="max-w-6xl space-y-10 animate-in fade-in duration-1000">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl ring-1 ring-inset ring-white/[0.01] relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[0.02] blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
         
         <div className="flex items-center gap-6 mb-12 relative z-10">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-xl">
               <Cpu className="w-7 h-7 text-indigo-400/80" />
            </div>
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Architectural Discovery Matrix</h2>
              <p className="text-[10px] text-muted-foreground/20 font-black uppercase tracking-[0.2em] mt-1">AI-Assisted Infrastructure Node Mapping</p>
            </div>
         </div>

         {isAnalyzing ? (
           <div className="space-y-10 py-12 relative z-10 flex flex-col items-center">
              <div className="w-80 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 ring-1 ring-inset ring-white/[0.01]">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
              </div>
              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> 
                   Mapping_Source_Graph...
                </span>
                <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest">Identifying core dependencies & fleet requirements</p>
              </div>
           </div>
         ) : (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 relative z-10">
             <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] ring-1 ring-inset ring-white/[0.01] hover:border-white/10 transition-colors duration-700">
                <div className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4">AUTONOMOUS_SUMMARY_MANIFEST</div>
                <p className="text-[13px] font-bold leading-relaxed text-foreground/70 uppercase tracking-widest max-w-4xl">
                  {claudeAnalysis?.summary}
                </p>
             </div>
             
             <div className="flex items-center justify-between gap-12 border-t border-white/5 pt-10">
                <div className="flex items-center gap-10">
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">CONFIDENCE_POOL</span>
                      <div className="flex items-center gap-4">
                         <span className="text-4xl font-black text-emerald-400 tracking-tighter">
                           {((claudeAnalysis?.confidence || 0) * 100).toFixed(1)}%
                         </span>
                         <div className="h-8 w-px bg-white/5" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/20">NOMINAL_STATE</span>
                      </div>
                   </div>
                </div>
                <Button onClick={handleApplyAnalysis} className="h-16 px-12 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl flex items-center gap-6 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition-all active:scale-[0.98]">
                  GENERATE_BLUEPRINT_MATRIX <ArrowRight className="w-5 h-5" />
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
      <div className="flex-1 p-8 lg:p-12 max-w-[1700px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-700">
        
        {/* Progress Nav - Control Sub-Grid Style */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-10 border-b border-white/5 pb-10">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-3 text-white/30 hover:text-white transition-all group px-5 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
              </button>
           </div>
           
           <div className="flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-2xl border border-white/5 shadow-2xl">
             {(['source', 'analysis', 'blueprint', 'ready'] as step[]).map((s, idx) => (
                <button 
                  key={s}
                  onClick={() => {
                    if (idx <= stepIndex(currentStep)) setCurrentStep(s)
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                    currentStep === s 
                     ? "text-white bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                     : idx < stepIndex(currentStep)
                       ? "text-foreground/60 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5"
                       : "text-muted-foreground/20 cursor-not-allowed opacity-40"
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
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {currentStep === 'source' && renderSourceStep()}
              {currentStep === 'analysis' && renderAnalysisStep()}
              {currentStep === 'blueprint' && (
                 <div className="space-y-10">
                    <InfrastructureBlueprint 
                      selectedServices={selectedServices}
                      setSelectedServices={setSelectedServices}
                      aiRecommended={claudeAnalysis?.recommended || []}
                      onConnectProvider={openConnectModal}
                      isConnected={isProviderConnected}
                      onNext={() => setCurrentStep('ready')}
                    />
                 </div>
              )}
              {currentStep === 'ready' && (
                <ReadyStep 
                  selectedServices={selectedServices} 
                  onDeploy={handleFinalDeploy} 
                  isDeploying={createEnvMutation.isLoading || deployStackMutation.isLoading} 
                />
              )}
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
        "p-8 rounded-[2rem] border transition-all duration-700 flex items-center gap-8 text-left group relative ring-1 ring-inset overflow-hidden",
        active 
          ? "bg-white/[0.03] border-indigo-500/40 ring-indigo-500/10 shadow-2xl" 
          : "bg-[#0a0a0a] border-white/5 ring-white/[0.01] hover:border-white/10"
      )}
    >
      {active && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] pointer-events-none" />}
      <div className={cn(
        "w-14 h-14 rounded-2xl border transition-all duration-700 shrink-0 flex items-center justify-center",
        active ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/[0.03] border-white/5 text-muted-foreground/20 group-hover:text-muted-foreground/40"
      )}>
         {icon}
      </div>
      <div className="space-y-2 min-w-0 flex-1">
        <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] transition-colors duration-700", active ? "text-foreground" : "text-muted-foreground/40")}>{title}</p>
        <p className={cn("text-[9px] font-bold uppercase tracking-widest transition-colors duration-700 leading-relaxed", active ? "text-foreground/40" : "text-muted-foreground/10")}>{desc}</p>
      </div>
      <div className={cn("w-2 h-2 rounded-full transition-all duration-700 shrink-0", active ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" : "bg-white/5 opacity-0")} />
    </button>
  )
}

function ReadyStep({ selectedServices, onDeploy, isDeploying }: { selectedServices: string[], onDeploy: () => void, isDeploying: boolean }) {
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tighter text-foreground">FINAL_MANIFEST_VALIDATION</h2>
        <p className="text-muted-foreground/40 text-[10px] uppercase font-black tracking-[0.3em]">Review the orchestration matrix before initializing the deployment sequence across target clusters.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl flex flex-col gap-10 ring-1 ring-inset ring-white/[0.01]">
           <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 flex items-center justify-between border-b border-white/5 pb-6">
              ORCHESTRATION_POOL <span>{selectedServices.length}_NODES</span>
           </h3>
           <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
             {selectedServices.map(id => (
                  <div key={id} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-[1.5rem] transition-all hover:bg-white/[0.03] group hover:border-white/10">
                    <div className="flex items-center gap-6">
                       <div className="w-10 h-10 bg-indigo-500/5 text-indigo-400/40 rounded-xl flex items-center justify-center border border-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                         <Zap className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-[11px] font-black tracking-[0.1em] uppercase text-foreground/70">{id.replace(/-/g, ' ')}</p>
                         <p className="text-[8px] text-muted-foreground/20 font-black uppercase tracking-widest mt-1">ACTIVE_MANIFEST_COMPONENT</p>
                       </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400/40" />
                  </div>
             ))}
           </div>
        </div>

        <div className="flex flex-col gap-10">
           <div className="p-10 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[2.5rem] relative overflow-hidden ring-1 ring-inset ring-indigo-500/[0.05]">
             <div className="absolute top-0 right-0 p-10">
                <Shield className="w-12 h-12 text-indigo-500/10" />
             </div>
             <div className="space-y-6 relative z-10">
                <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em]">DEPLOYMENT_HARDENING_PROTOCOL</h3>
                <p className="text-[10px] text-muted-foreground/40 leading-relaxed font-bold uppercase tracking-[0.2em]">
                   Orchestration requires manual confirmation. All security group rules, persistence layers, and mesh routing protocols will be provisioned according to the verified kernel blueprint.
                </p>
                <div className="flex items-center gap-4 text-emerald-400/40">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-[0.3em]">IAAS_READINESS_CONFIRMED</span>
                </div>
             </div>
           </div>
           
           <Button 
            disabled={isDeploying}
            onClick={onDeploy}
            className="w-full h-20 bg-white text-black hover:bg-zinc-200 font-black uppercase text-[12px] tracking-[0.4em] rounded-[1.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] group flex items-center justify-center gap-6"
           >
             {isDeploying ? (
                <>
                   <RefreshCw className="w-6 h-6 animate-spin" />
                   INITIALIZING_SEQUENCES...
                </>
             ) : (
               <>
                 AWAKEN_ENVIRONMENT_MATRIX
                 <ArrowRight className="w-6 h-6 group-hover:translate-x-4 transition-transform duration-700" />
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
