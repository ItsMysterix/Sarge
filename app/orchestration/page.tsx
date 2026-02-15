"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, 
  GitBranch, 
  Terminal, 
  Plus, 
  Rocket, 
  Settings,
  MoreVertical,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  Search,
  X,
  ShieldAlert
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { SecretsDashboard } from "@/components/rust-core/SecretsDashboard"

// --- Environments Tab ---
const EnvironmentsTab = ({ t, setShowModal }: any) => {
  const envsQuery = t.environments?.list?.useQuery?.()
  const environments = envsQuery?.data || []

  const getTypeColor = (type: string) => {
    switch (type) {
      case "prod": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "staging": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Layers className="w-4 h-4" /> Active Environments
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-black text-[10px] font-bold uppercase transition-all hover:scale-105"
        >
          <Plus className="w-3 h-3" /> New Cluster
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {environments.length === 0 ? (
          <div className="col-span-full py-12 text-center glass-card border-dashed">
            <Layers className="w-8 h-8 text-white/5 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No environments configured yet.</p>
          </div>
        ) : (
          environments.map((env: any) => (
            <div key={env.id} className="glass-card p-5 group hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{env.name}</h4>
                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full border uppercase font-bold", getTypeColor(env.type))}>
                      {env.type}
                    </span>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-muted-foreground cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-2 mb-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3 h-3" /> <code>{env.branch}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" /> {env.name.toLowerCase()}.sarge.io
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-muted-foreground uppercase font-bold tracking-tighter">Active</span>
                </div>
                <span className="text-muted-foreground">Updated {formatDistanceToNow(new Date(env.last_deploy || Date.now()))} ago</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- Pipelines Tab ---
const PipelinesTab = ({ t }: any) => {
  const [searchQuery, setSearchQuery] = useState("")
  const { data, isLoading } = t.deploy.getDeployments.useInfiniteQuery({ limit: 20 })
  const items = data?.pages[0]?.items || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Rocket className="w-4 h-4" /> Deployment History
        </h3>
        <div className="relative flex-1 max-w-xs">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
           <input 
              type="text" 
              placeholder="Filter pipelines..."
              className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/5 rounded-xl text-[10px] focus:outline-none focus:border-white/20"
           />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05]">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground italic">No recent deployments.</div>
          ) : (
            items.map((deploy: any) => (
              <div key={deploy.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer group transition-colors">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  deploy.status === 'success' ? "bg-emerald-500" : "bg-red-500"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{deploy.summary || 'Production Release'}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{deploy.commit?.slice(0,7)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" /> {deploy.branch}</span>
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formatDistanceToNow(new Date(deploy.createdAt))} ago</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
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
  const t = trpc as any

  const tabs = [
    { id: 'envs', name: 'Environments', icon: Layers },
    { id: 'pipelines', name: 'Pipelines', icon: GitBranch },
    { id: 'secrets', name: 'Secrets', icon: Terminal },
  ]

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="animate-slide-down">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Orchestration Hub</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              The engine room for your cloud resources. Deploy services, manage cluster states, and secure sensitive configurations.
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/[0.08] self-start md:self-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-tight",
                  activeTab === tab.id 
                    ? "bg-white text-zinc-950 shadow-xl scale-105" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[600px] stagger-children">
          {activeTab === 'envs' && <EnvironmentsTab t={t} setShowModal={setShowModal} />}
          {activeTab === 'pipelines' && <PipelinesTab t={t} />}
          {activeTab === 'secrets' && (
             <div className="glass-card p-8 animate-fade-in border-violet-500/10 bg-violet-500/[0.02]">
                <div className="flex items-center gap-3 mb-8">
                   <ShieldAlert className="w-5 h-5 text-violet-400" />
                   <div>
                     <h3 className="font-semibold">Enterprise Secret Vault</h3>
                     <p className="text-xs text-muted-foreground">Hardened encryption for environment variables and cloud keys.</p>
                   </div>
                </div>
                <div className="max-w-4xl mx-auto">
                   <SecretsDashboard />
                </div>
             </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
