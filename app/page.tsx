"use client"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useProject } from "@/lib/project-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  TrendingUp, Server, Activity, Zap, ArrowUpRight, GitBranch, Clock, CheckCircle2, XCircle
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
          <h1 className="text-2xl font-semibold mb-1">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's what's happening with your infrastructure
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Deployments */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Recent Deployments</h2>
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

          {/* Quick Links */}
          <div className="glass-card p-5">
            <h2 className="font-medium mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <QuickActionButton 
                label="New Deployment"
                onClick={() => router.push('/oneclick')}
              />
              <QuickActionButton 
                label="View Logs"
                onClick={() => router.push('/logs')}
              />
              <QuickActionButton 
                label="Manage Projects"
                onClick={() => router.push('/projects')}
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

function StatCard({ label, value, icon, trend, trendUp }: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="card-elevated">
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
}

function QuickActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-3 text-left text-sm rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-between group"
    >
      <span>{label}</span>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  )
}
