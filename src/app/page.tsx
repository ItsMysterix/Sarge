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

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { currentProject } = useProject()

  const t = trpc as any
  const deploymentsQuery = t.deploy.stats.useQuery({ projectId: currentProject?.id }, { 
    enabled: !!currentProject?.id 
  })
  const servicesSummaryQuery = t.metrics.servicesSummary.useQuery()

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
            onClick={() => router.push('/oneclick')}
            primary
          />
          <QuickAction 
            icon={<Terminal className="w-4 h-4" />}
            label="Logs"
            description="View live logs"
            onClick={() => router.push('/logs')}
          />
          <QuickAction 
            icon={<Key className="w-4 h-4" />}
            label="Variables"
            description="Manage env vars"
            onClick={() => router.push('/variables')}
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
            value={deploymentsQuery.data?.total || 0}
            icon={<Zap className="w-4 h-4" />}
            trend="+12%"
            trendUp
          />
          <StatCard 
            label="Active Services"
            value={servicesSummaryQuery.data?.length || 0}
            icon={<Server className="w-4 h-4" />}
          />
          <StatCard 
            label="Success Rate"
            value={`${deploymentsQuery.data?.successRate || 98}%`}
            icon={<TrendingUp className="w-4 h-4" />}
            trend="+2.1%"
            trendUp
          />
          <StatCard 
            label="Avg Build Time"
            value="1m 23s"
            icon={<Clock className="w-4 h-4" />}
            trend="-8s"
            trendUp
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Deployments */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Recent Pipelines</h2>
              <button 
                onClick={() => router.push('/deployments')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-2">
              {[
                { branch: 'main', status: 'success', time: '2 min ago', commit: 'a1b2c3d' },
                { branch: 'feature/auth', status: 'running', time: '5 min ago', commit: 'e4f5g6h' },
                { branch: 'main', status: 'success', time: '1 hour ago', commit: 'i7j8k9l' },
              ].map((deploy, i) => (
                <div key={i} className="list-item group">
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
                      <span className="text-xs text-muted-foreground font-mono">{deploy.commit}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{deploy.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources & Features */}
          <div className="glass-card p-5">
            <h2 className="font-medium mb-4">Resources</h2>
            <div className="space-y-2">
              <ResourceLink 
                icon={<Layers className="w-4 h-4" />}
                label="Environments"
                count="3"
                onClick={() => router.push('/environments')}
              />
              <ResourceLink 
                icon={<Database className="w-4 h-4" />}
                label="Databases"
                count="2"
                onClick={() => router.push('/services')}
              />
              <ResourceLink 
                icon={<Globe className="w-4 h-4" />}
                label="Domains"
                count="5"
                onClick={() => router.push('/settings')}
              />
              <ResourceLink 
                icon={<Shield className="w-4 h-4" />}
                label="Secrets"
                count="12"
                onClick={() => router.push('/variables')}
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">System Status</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500">All systems operational</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'API', status: 'operational' },
              { name: 'Database', status: 'operational' },
              { name: 'Storage', status: 'operational' },
              { name: 'CDN', status: 'operational' },
            ].map((service) => (
              <div key={service.name} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">{service.name}</span>
              </div>
            ))}
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
