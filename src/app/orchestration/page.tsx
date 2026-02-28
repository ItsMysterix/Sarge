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
import { motion, AnimatePresence } from "framer-motion"

import { EnvironmentsTab } from "@/components/orchestration/environments-tab"
import { PipelinesTab } from "@/components/orchestration/pipelines-tab"
import { PRPreviewsTab } from "@/components/orchestration/pr-previews-tab"
import { CronJobsTab } from "@/components/orchestration/cron-jobs-tab"

export default function OrchestrationHub() {
  const [activeTab, setActiveTab] = useState<'envs' | 'architecture' | 'pipelines' | 'previews' | 'secrets' | 'cron'>('envs')
  const [showModal, setShowModal] = useState(false)

  const tabs = [
    { id: 'envs', name: 'Environments', icon: Layers, desc: 'Active Fleet' },
    { id: 'architecture', name: 'Topology', icon: Box, desc: 'Infrastructure' },
    { id: 'pipelines', name: 'Pipelines', icon: Workflow, desc: 'CI/CD Streams' },
    { id: 'previews', name: 'Previews', icon: GitPullRequest, desc: 'Transient Apps' },
    { id: 'secrets', name: 'Secrets', icon: Terminal, desc: 'Vault Storage' },
    { id: 'cron', name: 'Cron Jobs', icon: Clock, desc: 'Scheduled Tasks' },
  ]

  return (
    <AppShell title="Orchestration">
      <div className="flex-1 p-8 lg:p-12 max-w-[1700px] mx-auto w-full flex flex-col gap-10 animate-in fade-in duration-700">
        
        {/* Header Summary */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg">
                <Workflow className="w-6 h-6 text-white/20" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">System Orchestration</h2>
                <p className="text-xs text-white/20 mt-0.5 uppercase font-bold tracking-widest leading-relaxed">Manager active environments and deployment workflows.</p>
              </div>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-start p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
                activeTab === tab.id 
                  ? "bg-white/[0.04] border-white/20 shadow-xl" 
                  : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
              )}
            >
              <tab.icon className={cn(
                "w-4 h-4 mb-5 transition-all",
                activeTab === tab.id ? "text-white" : "text-white/10 group-hover:text-white/20"
              )} />
              <div className="flex flex-col gap-1 min-w-0 w-full relative z-10">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest transition-colors",
                  activeTab === tab.id ? "text-white" : "text-white/20"
                )}>
                  {tab.name}
                </span>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-[0.15em] transition-colors",
                  activeTab === tab.id ? "text-white/40" : "text-white/5"
                )}>
                  {tab.desc}
                </span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          {activeTab === 'envs' && <EnvironmentsTab setShowModal={setShowModal} />}
          {activeTab === 'architecture' && (
             <div className="space-y-8 animate-in fade-in duration-700">
               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                     <Box className="w-5 h-5 text-white/20" />
                   </div>
                   <div>
                     <h2 className="text-sm font-bold text-white uppercase tracking-tight">Cloud Topology</h2>
                     <p className="text-xs text-white/20 mt-0.5 uppercase font-bold tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3" /> Real-time infrastructure graph
                     </p>
                   </div>
                 </div>
                 <Badge variant="outline" className="px-3 py-1 border-white/5 bg-black text-white/20 font-bold tracking-widest text-[8px] uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                    Live Sync
                 </Badge>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl">
                  <TopologyGraph />
               </div>
             </div>
          )}
          {activeTab === 'pipelines' && <PipelinesTab />}
          {activeTab === 'previews' && <PRPreviewsTab />}
          {activeTab === 'secrets' && (
             <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                   <div className="w-10 h-10 rounded-xl bg-red-400/[0.02] border border-red-500/10 flex items-center justify-center">
                     <Terminal className="w-5 h-5 text-red-500/40" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-white uppercase tracking-tight">Secrets Vault</h3>
                     <p className="text-xs text-white/20 mt-0.5 uppercase font-bold tracking-widest flex items-center gap-2 italic">
                       Secure environment variables and encrypted storage.
                     </p>
                   </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl">
                  <SecretsDashboard />
                </div>
             </div>
          )}
          {activeTab === 'cron' && <CronJobsTab />}
        </motion.div>
      </div>
    </AppShell>
  )
}
