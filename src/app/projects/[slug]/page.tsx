"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { 
  GitBranch, 
  Layout,
  Plus,
  Box,
  ShieldCheck,
  Zap,
  Clock,
  Activity,
  Server,
  Terminal,
  AlertTriangle,
  Globe,
  Cpu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { EnvironmentCreationModal } from "@/components/projects/EnvironmentCreationModal"
import { formatDistanceToNow } from "date-fns"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { currentProject } = useProject()
  const { addToast, ToastContainer } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeEnvTab, setActiveEnvTab] = useState<string>("overview")
  
  const projectSlug = params.slug

  // Data Fetching
  const projectQuery = trpc.project.getBySlug.useQuery({ slug: projectSlug })
  const project = projectQuery.data

  const envsQuery = trpc.environments.list.useQuery(
    { projectSlug }
  )
  const environments = envsQuery.data || []

  const statsQuery = trpc.project.getStats.useQuery(
    { projectSlug }
  )
  const stats = statsQuery.data

  const activityQuery = trpc.project.getActivity.useQuery(
    { projectSlug, limit: 10 }
  )
  const activity = activityQuery.data || []

  // Loading State
  if (projectQuery.isLoading || envsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Project" subtitle="Synchronizing environment data..." />
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold">Project not found</h1>
          <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have access.</p>
          <Button variant="outline" className="mt-6" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </AppShell>
    )
  }

  const handleCreateDeployment = () => {
    // If we have an environment selected, we can pass it to the deployment flow
    const targetEnv = environments.find(e => e.id === activeEnvTab)
    addToast({
      title: "Triggering Deployment",
      description: `Starting a new build for ${targetEnv?.name || 'default'} environment...`,
      type: "info"
    })
    // For now, redirect to orchestration or deployment builder
    router.push(`/orchestration/deploy?project=${projectSlug}${targetEnv ? `&env=${targetEnv.type}` : ''}`)
  }

  return (
    <AppShell>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl w-full animate-fade-in">
        <ToastContainer />
        
        {showCreateModal && (
          <EnvironmentCreationModal 
            projectSlug={projectSlug} 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => envsQuery.refetch()}
          />
        )}

        {/* Actions Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
               <div className="flex items-center gap-2 mt-2">
                 <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground bg-muted/20">
                    {project.slug}
                 </Badge>
                 <span className="text-muted-foreground text-[10px]">•</span>
                 <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                   <GitBranch className="w-3 h-3" /> {project.autoDeployBranch}
                 </span>
               </div>
            </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => router.push(`/settings?project=${projectSlug}`)} className="h-9">
                  <Server className="w-4 h-4 mr-2" /> Settings
               </Button>
               <Button onClick={handleCreateDeployment} className="h-9 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-[10px] tracking-wide">
                  <Zap className="w-4 h-4 mr-2" /> New Deployment
               </Button>
             </div>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="overview" onValueChange={setActiveEnvTab} className="w-full">
          <TabsList className="bg-muted/10 w-full justify-start border border-border/50 rounded-xl p-1 mb-8">
            <TabTrigger value="overview" icon={<Layout className="w-3.5 h-3.5" />} label="Project Overview" />
            {environments.map(env => (
              <TabTrigger 
                key={env.id} 
                value={env.id} 
                icon={<Box className="w-3.5 h-3.5" />} 
                label={env.name} 
              />
            ))}
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Environment</span>
            </button>
          </TabsList>

          {/* Overview Tab (Stats & Activity) */}
          <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Real Stats Area */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <StatCard label="Deployments" value={stats?.totalDeployments ?? 0} />
                   <StatCard label="Uptime" value={stats?.successfulDeployments ? `${((stats.successfulDeployments / (stats.totalDeployments || 1)) * 100).toFixed(1)}%` : "0%"} />
                   <StatCard label="Avg. Build" value={stats?.avgDeployTime ? `${stats.avgDeployTime}s` : "—"} />
                   <StatCard label="Active Services" value={stats?.activeServices ?? 0} />
                </div>

                {/* Environments List (Real Data) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                       <Box className="w-4 h-4" /> Environments
                    </h3>
                  </div>
                  
                  {environments.length === 0 ? (
                    <div className="min-h-[200px] flex flex-col items-center justify-center text-center border border-dashed border-border/50 rounded-3xl bg-muted/5 p-8 transition-all">
                        <div className="p-4 rounded-full bg-muted/20 mb-4 text-muted-foreground">
                          <Layout className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium mb-1 text-foreground">No Active Environments</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mb-6">
                          Provision infrastructure to start deploying services to this project.
                        </p>
                        <Button onClick={() => setShowCreateModal(true)} variant="outline" className="h-9 px-6 rounded-full border-foreground/10 hover:bg-muted text-xs">
                          <Plus className="w-4 h-4 mr-2" />
                          Provision First Environment
                        </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {environments.map(env => (
                        <div key={env.id} className="group p-5 bg-card border border-border rounded-2xl hover:border-foreground/20 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => setActiveEnvTab(env.id)}>
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                                  <Box className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-foreground text-sm">{env.name}</span>
                             </div>
                             <Badge className={cn(
                               "text-[8px] uppercase font-bold px-1.5 py-0",
                               env.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground"
                             )}>
                               {env.status}
                             </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
                            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> {env.type}</span>
                            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {env.region}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Feed (Real Data) */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                   <Activity className="w-4 h-4" /> Activity Feed
                 </h3>
                 <div className="bg-card border border-border/50 rounded-3xl p-6 min-h-[400px]">
                    {activity.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center italic text-muted-foreground text-xs">
                        No recent activity recorded.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activity.map((item: any) => (
                          <div key={item.id} className="relative pl-6 border-l border-border pb-6 last:pb-0">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-foreground border border-background" />
                            <div className="text-xs font-bold text-foreground mb-1 uppercase tracking-tight">{item.action}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-2 mb-1">
                              {JSON.stringify(item.details)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono opacity-60">
                              {formatDistanceToNow(new Date(item.created_at))} ago
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </TabsContent>

          {/* Environment-Specific Content (Dynamic) */}
          {environments.map(env => (
            <TabsContent key={env.id} value={env.id} className="space-y-6 focus-visible:outline-none animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3 space-y-6">
                    <div className="flex items-center justify-between p-6 bg-card border border-border rounded-3xl">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-foreground text-background rounded-2xl">
                             <Box className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{env.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">Target Cluster: {env.type} • Region: {env.region}</p>
                          </div>
                       </div>
                       <Button size="sm" variant="outline" className="rounded-full h-10 px-6 font-bold text-xs">
                          Live Metrics
                       </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-6 bg-muted/5 border border-border rounded-3xl">
                          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                             <Cpu className="w-4 h-4" /> Resource Config
                          </div>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">CPU Cores</span>
                                <span className="font-mono font-bold">{env.resource_config?.cpu || '0.5'}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Memory</span>
                                <span className="font-mono font-bold">{env.resource_config?.memory || '512MB'}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Replicas</span>
                                <span className="font-mono font-bold">{env.resource_config?.replicas || '1'}</span>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 bg-muted/5 border border-border rounded-3xl">
                          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                             <Terminal className="w-4 h-4" /> Endpoint Status
                          </div>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-bold uppercase tracking-tighter">Healthy</Badge>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">SSL</span>
                                <Badge className="bg-blue-500/10 text-blue-500 border-none text-[10px] font-bold uppercase tracking-tighter">Provisioned</Badge>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Last Ping</span>
                                <span className="font-mono text-[11px]">23ms ago</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="p-6 bg-card border border-border rounded-3xl">
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-tighter">Deployment Controls</h4>
                        <div className="space-y-3">
                           <Button className="w-full text-xs font-bold uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 h-10 rounded-2xl" onClick={handleCreateDeployment}>
                              Redeploy
                           </Button>
                           <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest h-10 rounded-2xl border-border/50">
                              Rollback
                           </Button>
                           <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-destructive h-10 rounded-2xl hover:bg-destructive/10">
                              Decommission
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  )
}

function TabTrigger({ value, icon, label, className }: { value: string, icon: any, label: string, className?: string }) {
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-tighter rounded-xl transition-all",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {icon}
      <span>{label}</span>
      </TabsTrigger>
  )
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
      <div className="text-[10px] text-muted-foreground uppercase font-black mb-2 tracking-widest">{label}</div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
    </div>
  )
}
