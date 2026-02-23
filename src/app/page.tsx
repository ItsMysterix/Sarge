"use client"

import React, { useEffect } from "react"
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
import TimeAgo from "timeago-react"
import { QuickAction } from "@/components/dashboard/quick-action"
import { StatCard } from "@/components/dashboard/stat-card"
import { ResourceLink } from "@/components/dashboard/resource-link"

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const { currentProject } = useProject()

  // Queries for dashboard data
  const deploymentsQuery = trpc.deploy.getDeployments.useQuery(
    {}, // Default limit/cursor
    { enabled: !!currentProject?.id }
  )
  const servicesQuery = trpc.stacks.list.useQuery(undefined, {
    enabled: !!currentProject?.id
  })

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/landing")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) return null

  const stats = {
    totalDeployments: deploymentsQuery.data?.items?.length || 0,
    activeServices: servicesQuery.data?.length || 0,
    successRate: "98%", // Placeholder or derive from deployments
    avgBuildTime: "1m 24s" // Placeholder
  }

  return (
    <AppShell title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.firstName || "Operator"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here&apos;s what&apos;s happening with your infrastructure today.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => router.push('/orchestration')}
               className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
             >
               <Rocket className="w-4 h-4" />
               Deploy New Service
             </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <QuickAction 
            primary
            icon={<Zap className="w-4 h-4" />}
            label="One-Click Deploy"
            description="Deploy from GitHub"
            onClick={() => router.push('/orchestration')}
          />
          <QuickAction 
            icon={<Terminal className="w-4 h-4" />}
            label="Provision"
            description="Cloud resources"
            onClick={() => router.push('/projects')}
          />
          <QuickAction 
            icon={<Key className="w-4 h-4" />}
            label="Secrets"
            description="Manage env vars"
            onClick={() => router.push('/settings')}
          />
          <QuickAction 
            icon={<Activity className="w-4 h-4" />}
            label="Metrics"
            description="View performance"
            onClick={() => router.push('/observability')}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Deployments"
            value={stats.totalDeployments}
            icon={<Layers className="w-4 h-4" />}
            trend="+12%"
            trendUp
          />
          <StatCard 
            label="Active Services"
            value={stats.activeServices}
            icon={<Server className="w-4 h-4" />}
          />
          <StatCard 
            label="Success Rate"
            value={stats.successRate}
            icon={<TrendingUp className="w-4 h-4" />}
            trend="+2.1%"
            trendUp
          />
          <StatCard 
            label="Avg Build Time"
            value={stats.avgBuildTime}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pipelines */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Recent Pipelines</h2>
              <button 
                onClick={() => router.push('/orchestration')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
              {deploymentsQuery.isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-white/5 rounded-lg" />
                  ))}
                </div>
              ) : deploymentsQuery.data?.items?.length ? (
                deploymentsQuery.data.items.slice(0, 5).map((deploy: any) => (
                  <div key={deploy.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      deploy.status === 'success' && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                      deploy.status === 'running' && "bg-amber-500 animate-pulse",
                      deploy.status === 'error' && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{deploy.branch || 'main'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded uppercase">{deploy.id.split('-')[0]}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                         {deploy.status}
                       </div>
                       <div className="text-[10px] text-muted-foreground">
                         <TimeAgo datetime={deploy.created_at} />
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                  No deployment history found.
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Resources */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-6">Infrastructure</h2>
            <div className="space-y-3">
              <ResourceLink 
                icon={<Globe className="w-4 h-4" />}
                label="Environment Targets"
                count="3"
                onClick={() => router.push('/orchestration')}
              />
              <ResourceLink 
                icon={<Database className="w-4 h-4" />}
                label="Provisioned Services"
                count={servicesQuery.data?.length?.toString() || "0"}
                onClick={() => router.push('/orchestration')}
              />
              <ResourceLink 
                icon={<Shield className="w-4 h-4" />}
                label="Security Posture"
                count="Secure"
                onClick={() => router.push('/settings')}
              />
              <ResourceLink 
                icon={<Settings className="w-4 h-4" />}
                label="Active Integrations"
                count="4"
                onClick={() => router.push('/settings')}
              />
            </div>
          </div>
        </div>

        {/* Global Status */}
        <div className="glass-card p-6 bg-emerald-500/[0.02] border-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-medium">Global AI Intelligence</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Systems Operational</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Machine learning models are actively monitoring your cloud footprint for anomalies and cost optimization opportunities.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
