"use client"
import React, { useEffect } from "react"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useProject } from "@/lib/project-context"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { 
  TrendingUp, Server, Activity, Zap, ArrowUpRight, GitBranch, Clock, 
  CheckCircle2, Layers, Terminal, Key, Settings, Rocket, Globe, 
  Database, Shield, Play, RotateCcw
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { currentProject } = useProject()

  const deploymentsStatsQuery = trpc.deploy.stats.useQuery({ projectId: currentProject?.id as string }, { 
    enabled: !!currentProject?.id 
  })
  const recentDeploymentsQuery = trpc.deploy.getDeployments.useQuery({ limit: 5 }, {
    enabled: !!currentProject?.id
  })
  const servicesSummaryQuery = trpc.metrics.getServicesSummary.useQuery()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/landing")
      return
    }
    if (isLoaded && isSignedIn && !currentProject) {
      router.replace("/projects")
    }
  }, [isLoaded, isSignedIn, currentProject, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Project</span>
            <span>/</span>
            <span className="text-foreground font-medium">{currentProject?.name || 'Dashboard'}</span>
          </div>
          <h1 className="text-2xl font-semibold mb-1">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's what's happening with your infrastructure
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger-children">
          <QuickAction 
            icon={<Rocket className="w-4 h-4" />}
            label="Deploy"
            description="Push to production"
            onClick={() => router.push('/orchestration')}
            primary
          />
          <QuickAction 
            icon={<Terminal className="w-4 h-4" />}
            label="Logs"
            description="View live logs"
            onClick={() => router.push('/observability?tab=telemetry')}
          />
          <QuickAction 
            icon={<Key className="w-4 h-4" />}
            label="Variables"
            description="Manage env vars"
            onClick={() => router.push('/settings?tab=variables')}
          />
          <QuickAction 
            icon={<Activity className="w-4 h-4" />}
            label="Metrics"
            description="View performance"
            onClick={() => router.push('/observability')}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard 
            label="Total Deployments"
            value={deploymentsStatsQuery.data?.total ?? 0}
            icon={<Zap className="w-4 h-4" />}
          />
          <StatCard 
            label="Active Services"
            value={servicesSummaryQuery.data?.length ?? 0}
            icon={<Server className="w-4 h-4" />}
          />
          <StatCard 
            label="Success Rate"
            value={`${deploymentsStatsQuery.data?.successRate ?? '0.0'}%`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard 
            label="Avg Build Time"
            value="—"
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Deployments */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Recent Pipelines</h2>
              <button 
                onClick={() => router.push('/orchestration')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-2">
              {recentDeploymentsQuery.data?.items?.length ? (
                recentDeploymentsQuery.data.items.slice(0, 5).map((deploy: any) => (
                  <div key={deploy.id} className="list-item group">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      deploy.status === 'success' && "bg-emerald-500",
                      deploy.status === 'running' && "bg-amber-500 animate-pulse",
                      deploy.status === 'failed' && "bg-red-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{deploy.branch}</span>
                        <span className="text-xs text-muted-foreground font-mono">{deploy.commit?.slice(0, 7)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(deploy.created_at))} ago
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  No recent deployments found.
                </div>
              )}
            </div>
          </div>

          {/* Resources & Features */}
          <div className="glass-card p-5">
            <h2 className="font-medium mb-4">Infrastructure</h2>
            <div className="space-y-2">
              <ResourceLink 
                icon={<Layers className="w-4 h-4" />}
                label="Environments"
                count={deploymentsStatsQuery.data?.active?.toString() || "0"}
                onClick={() => router.push('/orchestration')}
              />
              <ResourceLink 
                icon={<Database className="w-4 h-4" />}
                label="Provisioned Services"
                count={servicesSummaryQuery.data?.length?.toString() || "0"}
                onClick={() => router.push('/observability?tab=services')}
              />
              <ResourceLink 
                icon={<Globe className="w-4 h-4" />}
                label="Deployable Targets"
                count="Live"
                onClick={() => router.push('/projects')}
              />
              <ResourceLink 
                icon={<Shield className="w-4 h-4" />}
                label="Cloud Posture"
                count="Secure"
                onClick={() => router.push('/observability')}
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card p-5 bg-muted/5 border-dashed">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-widest">Global Intelligence</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Synchronized</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center py-4 italic">
            Connecting to all integrated cloud providers... 
            <span className="text-foreground ml-1">Everything looks healthy.</span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

const QuickAction = React.memo(({ icon, label, description, onClick, primary }: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  primary?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl text-left transition-all group",
        "border border-white/[0.06] gpu-accelerate",
        primary 
          ? "bg-gradient-to-br from-violet-500/20 to-purple-600/10 hover:from-violet-500/30 hover:to-purple-600/20 border-violet-500/20" 
          : "bg-white/[0.02] hover:bg-white/[0.05]"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors",
        primary ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
      )}>
        {icon}
      </div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  )
})

const StatCard = React.memo(({ label, value, icon, trend, trendUp }: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}) => {
  return (
    <div className="card-elevated gpu-accelerate">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground">{icon}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trendUp ? "text-emerald-400" : "text-red-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
})

const ResourceLink = React.memo(({ icon, label, count, onClick }: { 
  icon: React.ReactNode
  label: string
  count: string
  onClick: () => void 
}) => {
  return (
    <button 
      onClick={onClick}
      className="w-full p-3 text-left rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex items-center gap-3 group gpu-accelerate"
    >
      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
      </div>
      <span className="text-sm flex-1">{label}</span>
      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  )
})
