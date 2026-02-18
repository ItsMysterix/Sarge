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

  // Muted, minimal design - relying on borders and subtle bg changes rather than heavy colors
  const getTypeColor = (type?: string) => {
    if (!type) return "text-muted-foreground border-border bg-muted"
    switch (type.toLowerCase()) {
      case "production": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
      case "staging": return "text-amber-500 border-amber-500/20 bg-amber-500/5"
      default: return "text-muted-foreground border-border bg-muted"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Layers className="w-4 h-4" /> Active Environments
           </h3>
           <p className="text-xs text-muted-foreground font-medium">
             {environments.length} Active {environments.length === 1 ? 'Cluster' : 'Clusters'}
           </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-2" /> New Cluster
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {envsQuery.isLoading ? (
          <div className="col-span-full py-20"><LoadingScreen title="Synchronizing Clusters" subtitle="Broadcasting discovery packets..." /></div>
        ) : environments.length === 0 ? (
           <div className="col-span-full py-24 text-center border border-dashed border-border rounded-xl bg-muted/20">
             <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
             <p className="text-sm font-bold text-foreground mb-1">No infrastructure clusters configured.</p>
             <p className="text-xs text-muted-foreground mb-6">Provision your first environment to begin orchestrating resources.</p>
             <Button
                onClick={() => setShowModal(true)}
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest h-9"
             >
                Provision Infrastructure
             </Button>
           </div>
        ) : (
          environments.map((env: any) => (
            <div key={env.id} className="bg-card border border-border rounded-xl p-6 group hover:border-foreground/20 transition-all shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                 <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                   <Server className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm tracking-tight">{env.name}</h4>
                  <Badge variant="outline" className={cn("mt-1.5 text-[9px] px-2 py-0.5 rounded-md border uppercase font-bold tracking-widest", getTypeColor(env.type))}>
                    {env.type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                       <GitBranch className="w-3.5 h-3.5 opacity-50" /> Branch
                    </span>
                    <code className="text-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border text-[10px]">{env.branch || 'main'}</code>
                 </div>
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                       <Globe className="w-3.5 h-3.5 opacity-50" /> Region
                    </span>
                    <span className="text-foreground font-bold uppercase">{env.region || 'US-EAST-1'}</span>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    env.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )} />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{env.status}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-2 hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
                   Manage <ChevronRight className="w-3 h-3 ml-1" />
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Workflow className="w-4 h-4" /> Global Pipelines
           </h3>
           <p className="text-xs text-muted-foreground font-medium">
             Recent deployment activity across all projects
           </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 text-[10px] font-bold uppercase gap-2 hover:bg-muted">
           <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="w-full py-20"><LoadingScreen title="Fetching Pipelines" subtitle="Indexing global deployment history..." /></div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto" />
               <p className="text-xs text-muted-foreground font-medium">No global pipeline execution recorded yet.</p>
            </div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-muted/30 cursor-pointer group transition-colors">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg border",
                  deploy.status === 'success' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-red-500/20 text-red-500 bg-red-500/5"
                )}>
                   {deploy.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground tracking-tight truncate">{deploy.summary || 'Pipeline Execution'}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded border-border bg-muted text-muted-foreground font-medium uppercase tracking-wide">
                       {deploy.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3 opacity-50" /> {deploy.branch || 'main'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 opacity-50" /> {formatDistanceToNow(new Date(deploy.created_at))} ago</span>
                    <span className="font-mono text-muted-foreground/70">#{deploy.commit?.slice(0,7)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                   <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase rounded-md">Logs</Button>
                   <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
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
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in bg-background">
        
        {/* Tabs - Minimal Design */}
        <div className="mb-8 border-b border-border">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 pb-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                  activeTab === tab.id 
                    ? "border-foreground text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'envs' && <EnvironmentsTab setShowModal={setShowModal} />}
          {activeTab === 'pipelines' && <PipelinesTab />}
          {activeTab === 'secrets' && (
             <div className="pt-2">
                <SecretsDashboard />
             </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
