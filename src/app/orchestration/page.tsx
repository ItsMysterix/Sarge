"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, 
  GitBranch, 
  Terminal, 
  Plus, 
  MoreVertical,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Server,
  Activity,
  Box,
  ChevronRight,
  RefreshCw,
  Workflow
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { SecretsDashboard } from "@/components/rust-core/SecretsDashboard"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// --- Environments Tab ---
const EnvironmentsTab = ({ setShowModal }: { setShowModal: (v: boolean) => void }) => {
  const envsQuery = trpc.environments.all.useQuery()
  const environments = envsQuery?.data || []

  const getTypeColor = (type?: string) => {
    if (!type) return "text-muted-foreground border-border bg-muted/20"
    switch (type.toLowerCase()) {
      case "production": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
      case "staging": return "text-amber-500 border-amber-500/20 bg-amber-500/5"
      case "development": return "text-indigo-500 border-indigo-500/20 bg-indigo-500/5"
      default: return "text-muted-foreground border-border bg-muted/20"
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Layers className="w-4 h-4" /> Active Environments
           </h3>
           <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-tight">
             {environments.length} Active {environments.length === 1 ? 'Cluster' : 'Clusters'}
           </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase transition-all hover:scale-105 shadow-xl shadow-foreground/10"
        >
          <Plus className="w-3.5 h-3.5" /> New Cluster
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {envsQuery.isLoading ? (
          <div className="col-span-full py-20"><LoadingScreen title="Synchronizing Clusters" subtitle="Broadcasting discovery packets to all active regions..." /></div>
        ) : environments.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-border/50 rounded-[2rem] bg-muted/5 group transition-all duration-700 hover:bg-muted/10">
            <div className="relative inline-block mb-6">
               <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto relative z-10" />
            </div>
            <p className="text-sm font-bold text-foreground/80 mb-2">No infrastructure clusters configured.</p>
            <p className="text-xs text-muted-foreground mb-8 max-w-xs mx-auto">Provision your first environment to begin orchestrating cloud resources and deployments.</p>
            <button
               onClick={() => setShowModal(true)}
               className="text-[10px] uppercase font-bold text-foreground border border-foreground/20 px-8 py-3 rounded-xl hover:bg-foreground hover:text-background transition-all shadow-lg"
            >
               Provision Infrastructure
            </button>
          </div>
        ) : (
          environments.map((env: any) => (
            <div key={env.id} className="bg-card border border-border rounded-3xl p-6 group hover:border-foreground/20 transition-all shadow-sm hover:shadow-2xl hover:shadow-foreground/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <MoreVertical className="w-4 h-4 text-muted-foreground/30 cursor-pointer hover:text-foreground transition-colors" />
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                   <Server className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground tracking-tight">{env.name}</h4>
                  <Badge variant="outline" className={cn("mt-1 text-[8px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-widest", getTypeColor(env.type))}>
                    {env.type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                       <GitBranch className="w-3.5 h-3.5 opacity-30" /> Branch
                    </span>
                    <code className="text-foreground font-mono bg-muted px-2 py-0.5 rounded-md border border-border text-[9px]">{env.branch || 'main'}</code>
                 </div>
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                       <Globe className="w-3.5 h-3.5 opacity-30" /> Region
                    </span>
                    <span className="text-foreground font-bold uppercase">{env.region || 'US-EAST-1'}</span>
                 </div>
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                       <Box className="w-3.5 h-3.5 opacity-30" /> Provider
                    </span>
                    <span className="text-foreground font-bold uppercase tracking-widest">{env.provider_id || 'AWS'}</span>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    env.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )} />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{env.status}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-3 gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   Manage <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- Pipelines Tab ---
const PipelinesTab = () => {
  const { data, isLoading, refetch, isRefetching } = trpc.deploy.getDeployments.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )
  const items = data?.pages.flatMap(page => page.items) || []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Workflow className="w-4 h-4" /> Global Pipelines
           </h3>
           <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-tight">
             Cross-project deployment synchronization
           </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 text-[10px] font-bold uppercase gap-2">
           <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Force Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="w-full py-20"><LoadingScreen title="Fetching Pipelines" subtitle="Indexing global deployment history..." /></div>
          ) : items.length === 0 ? (
            <div className="p-24 text-center space-y-4">
               <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto" />
               <p className="text-xs text-muted-foreground font-medium">No global pipeline execution recorded yet.</p>
            </div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-6 flex items-center gap-6 hover:bg-muted/30 cursor-pointer group transition-all">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2",
                  deploy.status === 'success' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-red-500/20 text-red-500 bg-red-500/5"
                )}>
                   {deploy.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sm font-bold text-foreground tracking-tight truncate">{deploy.summary || 'Automated Pipeline Execution'}</span>
                    <Badge variant="outline" className="text-[8px] font-mono leading-none border-border bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                       {deploy.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><GitBranch className="w-3 h-3 opacity-50" /> {deploy.branch || 'main'}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-50" /> {formatDistanceToNow(new Date(deploy.created_at))} ago</span>
                    <span className="font-mono text-indigo-500 lowercase">#{deploy.commit?.slice(0,7)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                   <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase rounded-lg">View Logs</Button>
                   <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-foreground/50" />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrchestrationHub() {
  const [activeTab, setActiveTab] = useState<'envs' | 'pipelines' | 'secrets'>('envs')
  const [showModal, setShowModal] = useState(false)

  const tabs = [
    { id: 'envs', name: 'Environments', icon: Layers },
    { id: 'pipelines', name: 'Pipelines', icon: Workflow },
    { id: 'secrets', name: 'Secrets', icon: Terminal },
  ]

  return (
    <AppShell title="Orchestration Hub">
      <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full animate-fade-in bg-background">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-10 mb-12">
          <div className="flex bg-muted/20 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-foreground text-background shadow-2xl scale-[1.05]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[700px]">
          {activeTab === 'envs' && <EnvironmentsTab setShowModal={setShowModal} />}
          {activeTab === 'pipelines' && <PipelinesTab />}
          {activeTab === 'secrets' && (
             <div className="stagger-children">
                <SecretsDashboard />
             </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
