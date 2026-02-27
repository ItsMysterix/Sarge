"use client"
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, GitBranch, Terminal, Plus, MoreVertical, Globe, Clock, CheckCircle2,
  XCircle, ArrowUpRight, Server, Activity, Box, ChevronRight, RefreshCw,
  Workflow, RotateCcw, GitPullRequest, ExternalLink, ShieldAlert
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import TimeAgo from "timeago-react"
import { TopologyGraph } from "@/components/infrastructure/topology-graph"
import { SecretsDashboard } from "@/components/rust-core/SecretsDashboard"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProject } from "@/lib/project-context"

import { EnvironmentsTab } from "@/components/orchestration/environments-tab"
import { PipelinesTab } from "@/components/orchestration/pipelines-tab"
import { PRPreviewsTab } from "@/components/orchestration/pr-previews-tab"
import { CronJobsTab } from "@/components/orchestration/cron-jobs-tab"

export default function OrchestrationHub() {
  const [activeTab, setActiveTab] = useState<'envs' | 'architecture' | 'pipelines' | 'previews' | 'secrets' | 'cron'>('envs')
  const [showModal, setShowModal] = useState(false)

  const tabs = [
    { id: 'envs', name: 'Fleet', icon: Layers, desc: 'Environment Management' },
    { id: 'architecture', name: 'Topology', icon: Box, desc: 'Infrastructure Mapping' },
    { id: 'pipelines', name: 'Streams', icon: Workflow, desc: 'CI/CD Pipelines' },
    { id: 'previews', name: 'Transient', icon: GitPullRequest, desc: 'PR Preview Environments' },
    { id: 'secrets', name: 'Vault', icon: Terminal, desc: 'Sensitive Configuration' },
    { id: 'cron', name: 'Chronos', icon: Clock, desc: 'Scheduled Tasks' },
  ]

  return (
    <AppShell title={
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <Workflow className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-black tracking-[0.4em] uppercase text-foreground/90">Fleet_Command_Matrix</span>
          <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
            Active_Orchestration_Kernel_v2.4.0
          </span>
        </div>
      </div>
    }>
      <div className="flex-1 p-8 lg:p-12 max-w-[1800px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-1000">
        
        {/* Control Sub-Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-start p-6 rounded-[1.5rem] border transition-all duration-700 text-left group relative overflow-hidden ring-1 ring-inset",
                activeTab === tab.id 
                  ? "bg-white/[0.03] border-indigo-500/40 ring-indigo-500/10 shadow-2xl" 
                  : "bg-[#0a0a0a] border-white/5 ring-white/[0.01] hover:border-white/10"
              )}
            >
              {activeTab === tab.id && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] pointer-events-none" />
              )}
              <tab.icon className={cn(
                "w-5 h-5 mb-5 transition-all duration-700",
                activeTab === tab.id ? "text-indigo-400 scale-110" : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
              )} />
              <div className="flex flex-col gap-1.5 min-w-0 w-full relative z-10">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-700",
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {tab.name}
                </span>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest truncate transition-colors duration-700",
                  activeTab === tab.id ? "text-foreground/30" : "text-muted-foreground/10"
                )}>
                  {tab.desc}
                </span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 animate-in slide-in-from-bottom-4 duration-1000">
          {activeTab === 'envs' && <EnvironmentsTab setShowModal={setShowModal} />}
          {activeTab === 'architecture' && (
             <div className="space-y-10 animate-in fade-in duration-1000">
               <div className="flex items-end justify-between border-b border-white/5 pb-8">
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center ring-1 ring-inset ring-white/[0.01] shadow-2xl">
                     <Box className="w-7 h-7 text-indigo-400/80" />
                   </div>
                   <div>
                     <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Infrastructure_Topology_Graph</h2>
                     <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                       <Activity className="w-3 h-3" /> Recursive Discovery Matrix // AWS_CLOUD_MAP_PROTOCOL
                     </p>
                   </div>
                 </div>
                 <div className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">Realtime_Mapping_Active</span>
                 </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden ring-1 ring-inset ring-white/[0.02]">
                  <div className="p-10">
                    <TopologyGraph />
                  </div>
               </div>
             </div>
          )}
          {activeTab === 'pipelines' && <PipelinesTab />}
          {activeTab === 'previews' && <PRPreviewsTab />}
          {activeTab === 'secrets' && (
             <div className="space-y-10">
                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                   <div className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                     <Terminal className="w-6 h-6 text-red-400/60" />
                   </div>
                   <div>
                     <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Encrypted_Vault_Interface</h3>
                     <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                       <ShieldAlert className="w-3 h-3" /> Level_4_Security_Access // HSM_BACKED_PROTOCOLS
                     </p>
                   </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden ring-1 ring-inset ring-white/[0.01]">
                   <div className="p-10">
                    <SecretsDashboard />
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'cron' && <CronJobsTab />}
        </div>
      </div>
    </AppShell>
  )
}

