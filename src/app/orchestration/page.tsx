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
    { id: 'envs', name: 'Environments', icon: Layers },
    { id: 'architecture', name: 'Topology', icon: Box },
    { id: 'pipelines', name: 'Pipelines', icon: Workflow },
    { id: 'previews', name: 'PR Previews', icon: GitPullRequest },
    { id: 'secrets', name: 'Secrets', icon: Terminal },
    { id: 'cron', name: 'Cron Jobs', icon: Clock },
  ]

  return (
    <AppShell title="Orchestration Hub">
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in bg-background">
        <div className="mb-8 border-b border-border">
          <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center whitespace-nowrap gap-2 pb-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
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

        <div className="min-h-[600px]">
          {activeTab === 'envs' && <EnvironmentsTab setShowModal={setShowModal} />}
          {activeTab === 'architecture' && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <div className="space-y-1">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <Box className="w-4 h-4" /> Infrastructure Topology
                 </h3>
                 <p className="text-xs text-muted-foreground font-medium">Auto-discovered dependency graph built via AWS Cloud Map & VPC flow logs.</p>
               </div>
               <TopologyGraph />
             </div>
          )}
          {activeTab === 'pipelines' && <PipelinesTab />}
          {activeTab === 'previews' && <PRPreviewsTab />}
          {activeTab === 'secrets' && (
             <div className="pt-2">
                <SecretsDashboard />
             </div>
          )}
          {activeTab === 'cron' && <CronJobsTab />}
        </div>
      </div>
    </AppShell>
  )
}

