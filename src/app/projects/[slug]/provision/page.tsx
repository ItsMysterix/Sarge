"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Plus, 
  ArrowLeft, 
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
  Settings,
  Brain
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { trpc } from "@/lib/trpc"
import { LoadingScreen } from "@/components/ui/loading-screen"

interface ServiceOption {
  id: string
  name: string
  type: 'frontend' | 'backend' | 'database' | 'monitoring' | 'cache' | 'compute'
  icon: any
  description: string
  recommended?: boolean
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'nextjs', name: 'Next.js Frontend', type: 'frontend', icon: Globe, description: 'Edge-rendered React framework', recommended: true },
  { id: 'nodejs', name: 'Node.js API', type: 'backend', icon: Server, description: 'Scalable JavaScript backend' },
  { id: 'postgres', name: 'PostgreSQL', type: 'database', icon: Database, description: 'Advanced relational database', recommended: true },
  { id: 'redis', name: 'Redis Cache', type: 'cache', icon: Zap, description: 'In-memory data structure store' },
  { id: 'prometheus', name: 'Prometheus', type: 'monitoring', icon: Activity, description: 'Metrics & time-series data' },
  { id: 'grafana', name: 'Grafana Dashboard', type: 'monitoring', icon: Monitor, description: 'Data visualization & alerts', recommended: true },
  { id: 'go-api', name: 'Go Backend', type: 'backend', icon: Cpu, description: 'High-performance microservice' },
  { id: 'python-ai', name: 'Python AI Engine', type: 'backend', icon: Brain, description: 'Data processing & inference' },
  { id: 'mongodb', name: 'MongoDB', type: 'database', icon: Layers, description: 'NoSQL document database' },
  { id: 'lambda', name: 'AWS Lambda', type: 'compute', icon: Cloud, description: 'Serverless function execution' },
  { id: 'docker-app', name: 'Docker Cluster', type: 'compute', icon: Server, description: 'Containerized infrastructure' },
  { id: 'iam-vault', name: 'Security Vault', type: 'compute', icon: Shield, description: 'IAM & Secrets management' },
]

const SERVICE_TO_PROVIDER: Record<string, string> = {
  'nextjs': 'vercel',
  'nodejs': 'railway',
  'postgres': 'aws',
  'redis': 'railway',
  'prometheus': 'local',
  'grafana': 'local',
  'lambda': 'aws',
  'docker-app': 'kubernetes',
  'iam-vault': 'aws',
}

export default function ProvisionPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const projectSlug = params.slug
  const { addToast, ToastContainer } = useToast()
  
  const [activeTab, setActiveTab] = useState<'services' | 'configuration' | 'provisioning'>('services')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [envName, setEnvName] = useState("Production")
  const [envType, setEnvType] = useState<"development" | "staging" | "production">("production")
  const [isProvisioning, setIsProvisioning] = useState(false)

  // Fetch providers to check integration
  const providersQuery = (trpc as any).providers.list.useQuery({ projectSlug })
  const providers = providersQuery.data || []

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`provisioning_draft_${projectSlug}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setSelectedServices(data.services || [])
        if (data.envName) setEnvName(data.envName)
        if (data.envType) setEnvType(data.envType)
      } catch (e) {
        console.error("Failed to parse saved state", e)
      }
    }
  }, [projectSlug])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`provisioning_draft_${projectSlug}`, JSON.stringify({
      services: selectedServices,
      envName,
      envType
    }))
  }, [selectedServices, envName, envType, projectSlug])

  const isConnected = (serviceId: string) => {
    const providerId = SERVICE_TO_PROVIDER[serviceId] || 'local'
    if (providerId === 'local') return true
    return providers.some((p: any) => p.id === providerId && p.status === 'connected')
  }

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    const missingIntegrations = selectedServices.filter(s => !isConnected(s))
    
    if (selectedServices.length === 0) {
      addToast({ type: 'error', title: 'Selection Required', description: 'Please select at least one service to provision.' })
      return
    }

    if (missingIntegrations.length > 0) {
      addToast({ 
        type: 'warning', 
        title: 'Integrations Required', 
        description: `You need to connect providers for ${missingIntegrations.join(', ')} before provisioning.` 
      })
      setTimeout(() => router.push('/settings?tab=targets'), 2000)
      return
    }

    setActiveTab('configuration')
  }

  // TRPC Mutation
  const createEnv = trpc.environments.create.useMutation({
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Environment Provisioned', description: `Successfully created ${data.name}.` })
      localStorage.removeItem(`provisioning_draft_${projectSlug}`)
      setTimeout(() => router.push(`/projects/${projectSlug}`), 1500)
    },
    onError: (err) => {
       setIsProvisioning(false)
       addToast({ type: 'error', title: 'Provisioning Failed', description: err.message })
    }
  })

  const handleProvision = async () => {
    setIsProvisioning(true)
    createEnv.mutate({
      projectSlug,
      name: envName,
      type: envType as any,
      providerId: 'local', // Defaulting for simple flow
      region: 'us-east-1'
    })
  }

  if (providersQuery.isLoading) return <LoadingScreen />

  return (
    <AppShell title="Provision Infrastructure">
      <ToastContainer />
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => router.push(`/projects/${projectSlug}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Project Details
        </button>

        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-foreground">Infrastructure Assembly</h1>
             <p className="text-muted-foreground text-sm mt-2 max-w-xl">
               Configure and provision a complete cloud environment. Our AI engine has analyzed your needs and recommended the following components.
             </p>
           </div>
           
           {/* Progress Stepper */}
           <div className="flex bg-muted/20 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm">
             <StepIndicator active={activeTab === 'services'} done={activeTab !== 'services'} label="Services" />
             <StepIndicator active={activeTab === 'configuration'} done={activeTab === 'provisioning'} label="Setup" />
             <StepIndicator active={activeTab === 'provisioning'} done={false} label="Deploy" />
           </div>
        </div>

        {activeTab === 'services' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
               <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                 <Layers className="w-4 h-4" /> Component Blueprint
               </h2>
               <div className="text-xs text-muted-foreground">
                 {selectedServices.length} components selected
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {SERVICE_OPTIONS.map((svc) => (
                 <ServiceCard 
                    key={svc.id} 
                    service={svc} 
                    selected={selectedServices.includes(svc.id)} 
                    onToggle={() => toggleService(svc.id)}
                    connected={isConnected(svc.id)}
                 />
               ))}
            </div>

            <div className="flex justify-end pt-8 border-t border-border">
               <Button onClick={handleNext} className="h-11 px-10 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-lg">
                 Continue to Configuration
               </Button>
            </div>
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="max-w-3xl space-y-8 animate-fade-in">
             <h2 className="text-lg font-bold text-foreground">Environment Properties</h2>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Environment Name</label>
                  <input 
                    type="text" 
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-foreground focus:outline-none focus:border-foreground/30"
                  />
                </div>

                <div>
                   <label className="block text-xs font-bold text-muted-foreground uppercase mb-4">Instance Type</label>
                   <div className="flex gap-4">
                      {['development', 'staging', 'production'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setEnvType(type as any)}
                          className={cn(
                            "flex-1 p-4 rounded-2xl border text-center transition-all",
                            envType === type 
                              ? "bg-foreground text-background border-foreground shadow-xl" 
                              : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                          )}
                        >
                          <span className="block text-xs font-bold uppercase tracking-tight">{type}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                   <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                     <Shield className="w-4 h-4" /> Provider Intelligence
                   </h3>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Your selected services require an active cloud connection. Please ensure your AWS or Kubernetes provider is connected in settings.
                   </p>
                   <Button onClick={() => router.push('/settings')} variant="ghost" className="mt-4 p-0 h-auto text-[10px] text-indigo-400 font-bold uppercase tracking-widest hover:bg-transparent hover:text-indigo-300">
                     Check Integrations <Plus className="w-3 h-3 ml-1" />
                   </Button>
                </div>
             </div>

             <div className="flex gap-4 justify-end pt-8 border-t border-border">
                <Button variant="ghost" onClick={() => setActiveTab('services')} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Back
                </Button>
                <Button onClick={handleProvision} disabled={isProvisioning} className="h-11 px-10 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg">
                  {isProvisioning ? 'Provisioning...' : 'Provision Infrastructure'}
                </Button>
             </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function StepIndicator({ active, done, label }: { active: boolean, done: boolean, label: string }) {
  return (
    <div className={cn(
      "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
      active ? "bg-background text-foreground shadow-sm" : done ? "text-emerald-500" : "text-muted-foreground/50"
    )}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : null}
      {label}
    </div>
  )
}

function ServiceCard({ service, selected, onToggle, connected }: { service: ServiceOption, selected: boolean, onToggle: () => void, connected: boolean }) {
  const Icon = service.icon
  const providerId = SERVICE_TO_PROVIDER[service.id] || 'local'
  
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "relative p-5 rounded-3xl border transition-all cursor-pointer group",
        selected 
          ? "bg-foreground/5 border-foreground/40 shadow-md ring-1 ring-foreground/20" 
          : "bg-card border-border/50 hover:border-foreground/20",
        !connected && selected && "border-amber-500/50 ring-amber-500/20"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-2xl transition-all",
          selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}>
           <Icon className="w-5 h-5" />
        </div>
        {selected && connected && <CheckCircle2 className="w-5 h-5 text-foreground animate-in zoom-in-50" />}
        {selected && !connected && (
           <div className="flex flex-col items-end">
             <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
             <span className="text-[8px] font-bold text-amber-500 uppercase mt-1">Unlinked</span>
           </div>
        )}
      </div>
      
      <div>
        <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
          {service.name}
          {service.recommended && !selected && (
            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20">AI</span>
          )}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            {providerId} 
         </span>
         {!connected && (
            <span className="text-[8px] text-amber-500 font-bold uppercase underline">Connect Provider</span>
         )}
         {connected && (
            <span className="text-[10px] text-foreground font-bold">Select</span>
         )}
      </div>
    </div>
  )
}
