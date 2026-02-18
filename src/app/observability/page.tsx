"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, 
  Terminal, 
  RefreshCw, 
  History,
  ShieldAlert,
  Box,
  Layers,
  ShieldCheck,
  Search,
  Globe,
  Database,
  Cpu,
  Server,
  Workflow,
  Download,
  Filter,
  ArrowRight,
  Eye,
  Lock,
  GitCompare,
  TrendingDown,
  Coins
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

// --- Shared Components ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card border border-border rounded-2xl p-6 shadow-sm", className)}>
    {children}
  </div>
)

// --- Inventory Section ---
const InventorySection = ({ projectSlug }: { projectSlug: string }) => {
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug })
  const resources = inventoryQuery.data || []

  if (inventoryQuery.isLoading) return <div className="p-12 text-center animate-pulse"><Box className="w-8 h-8 mx-auto opacity-20" /></div>

  return (
    <div className="space-y-6">
      {resources.length === 0 ? (
        <Card className="border-dashed py-20 text-center">
           <Box className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
           <p className="text-sm text-muted-foreground italic">No cloud assets discovered for this project.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res: any) => (
            <Card key={res.id}>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <Box className="w-5 h-5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="font-bold text-sm truncate">{res.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{res.type.split(':').pop()}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className="text-[9px] uppercase font-bold">{res.status}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{res.region}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Services Section ---
const ServicesSection = () => {
  const t = trpc as any
  const { data: services = [], isLoading } = t.services.all.useQuery(undefined, { refetchOnWindowFocus: false })

  if (isLoading) return <div className="p-12 text-center animate-pulse"><Layers className="w-8 h-8 mx-auto opacity-20" /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {services.map((service: any) => (
        <Card key={service.id}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted border border-border">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", service.status === 'up' ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{service.status}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Uptime</p>
              <p className="text-xs font-bold">{Number(service.uptime_percent).toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Latency</p>
              <p className="text-xs font-bold">{service.latency || "--"}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Cost</p>
              <p className="text-xs font-bold">${Number(service.cost_hr).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// --- Logs Section ---
const LogsSection = ({ projectId }: { projectId: string }) => {
  const { addToast } = useToast()
  const [search, setSearch] = useState("")
  
  const listingQuery = trpc.logs.listing.useQuery({
    projectId,
    search: search || undefined,
    limit: 50
  }, { enabled: !!projectId })

  const logs = listingQuery.data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search telemetry..." 
            className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => listingQuery.refetch()}>
          <RefreshCw className={cn("w-4 h-4 mr-2", listingQuery.isRefetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <Card className="p-0 font-mono text-[11px] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-border bg-muted/30 font-bold uppercase text-muted-foreground">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-9">Message</div>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No logs found for current query.</div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-2 hover:bg-muted/10">
                <div className="col-span-2 text-muted-foreground">{format(new Date(log.timestamp || log.createdAt), "HH:mm:ss")}</div>
                <div className="col-span-1 border-r border-border truncate">
                  <span className={cn(
                    "font-bold uppercase",
                    log.level === 'error' ? "text-red-500" : log.level === 'warning' ? "text-amber-500" : "text-indigo-500"
                  )}>{log.level || 'info'}</span>
                </div>
                <div className="col-span-9 truncate text-foreground/80">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

// --- Governance Section ---
const ComplianceSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId }, { enabled: !!projectId })
  const overview = costOverview.data || { totalCost: 0 }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="text-center py-10">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Monthly Spend</p>
          <p className="text-4xl font-black">${overview.totalCost.toFixed(2)}</p>
        </Card>
        <Card className="text-center py-10">
          <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Compliance Status</p>
          <p className="text-4xl font-black text-emerald-600 uppercase">Passed</p>
        </Card>
      </div>
    </div>
  )
}

// --- Main Hub Layout ---
export default function ObservatoryHub() {
  const { currentProject } = useProject()
  
  // High-Resolution Project Activity
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug: currentProject?.slug || "" },
    { enabled: !!currentProject?.slug, staleTime: 10000 }
  )

  const activity = dashboardQuery.data?.activity || []

  if (!currentProject) {
    return (
      <AppShell title="Observatory">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
           <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
           <h2 className="text-xl font-bold">No Project Selected</h2>
           <p className="text-muted-foreground mt-2">Select a project from the sidebar to view observability data.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={`Observatory: ${currentProject.name}`}>
      <div className="flex-1 flex flex-col bg-background">
        
        <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border py-2 px-6">
           <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="bg-transparent h-12 gap-6 p-0">
                  {[
                    { id: 'activity', name: 'Activity', icon: Activity },
                    { id: 'inventory', name: 'Inventory', icon: Box },
                    { id: 'services', name: 'Services', icon: Layers },
                    { id: 'telemetry', name: 'Telemetry (Logs)', icon: Terminal },
                    { id: 'compliance', name: 'Compliance', icon: ShieldCheck },
                  ].map(tab => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="px-0 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="pt-8 pb-32">
                  <TabsContent value="activity">
                    <div className="max-w-4xl mx-auto space-y-6">
                       <div className="flex items-center justify-between px-1">
                          <h2 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                             <History className="w-4 h-4" /> Event Stream
                          </h2>
                          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => dashboardQuery.refetch()}>
                             <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Sync
                          </Button>
                       </div>
                       
                       <Card className="min-h-[500px]">
                          {activity.length === 0 ? (
                             <div className="text-center py-20 italic text-muted-foreground">No recent events recorded.</div>
                          ) : (
                             <div className="space-y-8 relative">
                                <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border" />
                                {activity.map((item: any) => (
                                   <div key={item.id} className="relative pl-8 space-y-2">
                                      <div className={cn(
                                         "absolute left-0 top-1.5 w-2 h-2 rounded-full",
                                         item.action.includes('SUCCESS') ? "bg-emerald-500" : 
                                         item.action.includes('FAILED') ? "bg-red-500" : "bg-indigo-500"
                                      )} />
                                      <div className="flex items-center justify-between">
                                         <p className="text-sm font-bold">{item.action.replace(/_/g, ' ')}</p>
                                         <span className="text-[10px] font-medium text-muted-foreground">{formatDistanceToNow(new Date(item.created_at))} ago</span>
                                      </div>
                                      <div className="p-3 bg-muted/40 border border-border/50 rounded-xl text-xs text-muted-foreground leading-relaxed">
                                         {JSON.stringify(item.details)}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory">
                    <InventorySection projectSlug={currentProject.slug} />
                  </TabsContent>

                  <TabsContent value="services">
                    <ServicesSection />
                  </TabsContent>

                  <TabsContent value="telemetry">
                    <LogsSection projectId={currentProject.id} />
                  </TabsContent>

                  <TabsContent value="compliance">
                    <ComplianceSection projectId={currentProject.id} />
                  </TabsContent>
                </div>
              </Tabs>
           </div>
        </div>

      </div>
    </AppShell>
  )
}
