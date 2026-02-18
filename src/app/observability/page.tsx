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
import { GridLoader } from "@/components/ui/grid-loader"
import { useProject } from "@/lib/project-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

// --- Shared Components ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm", className)}>
    {children}
  </div>
)

// --- Inventory Section ---
const InventorySection = ({ projectSlug }: { projectSlug: string }) => {
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug })
  const resources = inventoryQuery.data || []

  if (inventoryQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-muted/30">
           <Box className="w-12 h-12 text-muted-foreground/30 mb-4" />
           <p className="text-sm font-medium text-muted-foreground">No cloud assets discovered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res: any) => (
            <Card key={res.id} className="group hover:border-foreground/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted border border-border group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Box className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{res.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{res.type.split(':').pop()}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest bg-muted text-foreground">{res.status}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono font-medium">{res.region}</span>
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

  if (isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {services.map((service: any) => (
        <Card key={service.id} className="hover:border-foreground/20 transition-colors">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted border border-border">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", service.status === 'up' ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{service.status}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Uptime</p>
              <p className="text-xs font-bold">{Number(service.uptime_percent).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Latency</p>
              <p className="text-xs font-bold">{service.latency || "--"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cost</p>
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
  const [search, setSearch] = useState("")
  
  const listingQuery = trpc.logs.listing.useQuery({
    projectId,
    search: search || undefined,
    limit: 50
  }, { enabled: !!projectId })

  const logs = listingQuery.data?.items || []

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search telemetry..." 
            className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-foreground/30 transition-colors font-medium"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => listingQuery.refetch()} className="h-10 px-4 font-bold uppercase text-[10px] tracking-widest">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", listingQuery.isRefetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-9">Message</div>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto font-mono text-[11px]">
          {listingQuery.isLoading ? (
             <div className="p-12 flex justify-center"><GridLoader size="sm" /></div>
          ) : logs.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground font-medium">No logs matched your query.</div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-muted/10 transition-colors">
                <div className="col-span-2 text-muted-foreground">{format(new Date(log.timestamp || log.createdAt), "HH:mm:ss")}</div>
                <div className="col-span-1 truncate">
                  <span className={cn(
                    "font-bold uppercase tracking-wider text-[9px]",
                    log.level === 'error' ? "text-red-500" : log.level === 'warning' ? "text-amber-500" : "text-emerald-500"
                  )}>{log.level || 'info'}</span>
                </div>
                <div className="col-span-9 truncate text-foreground/90">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// --- Governance Section ---
const ComplianceSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId }, { enabled: !!projectId })
  const overview = costOverview.data || { totalCost: 0 }

  if (costOverview.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="text-center py-12">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Monthly Spend</p>
          <p className="text-4xl font-bold tracking-tight">${overview.totalCost.toFixed(2)}</p>
        </Card>
        <Card className="text-center py-12">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Compliance Status</p>
          <p className="text-4xl font-bold text-emerald-600 uppercase tracking-tight">Passed</p>
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
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[50vh]">
           <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
           <h2 className="text-xl font-bold tracking-tight">No Project Selected</h2>
           <p className="text-sm font-medium text-muted-foreground mt-2">Select a project from the sidebar to view observability data.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" /> 
        <span className="font-bold tracking-tight">Observability</span>
      </div>
    }>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        
        <Tabs defaultValue="activity" className="w-full space-y-8">
          <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-border w-full justify-start rounded-none">
            {[
              { id: 'activity', name: 'Activity', icon: History },
              { id: 'inventory', name: 'Inventory', icon: Box },
              { id: 'services', name: 'Services', icon: Layers },
              { id: 'telemetry', name: 'Telemetry', icon: Terminal },
              { id: 'compliance', name: 'Compliance', icon: ShieldCheck },
            ].map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent shadow-none gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground/80"
              >
                <tab.icon className="w-3.5 h-3.5 mb-0.5" />
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-[500px]">
            <TabsContent value="activity" className="m-0">
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Event Stream
                    </h2>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground" onClick={() => dashboardQuery.refetch()}>
                       <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Sync
                    </Button>
                 </div>
                 
                 <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
                    {activity.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-24 text-center">
                         <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
                         <p className="text-sm font-medium text-muted-foreground">No recent events recorded.</p>
                       </div>
                    ) : (
                       <div className="space-y-0 text-sm">
                          {activity.map((item: any, i: number) => (
                             <div key={item.id} className="relative pl-8 pb-8 last:pb-0 group">
                                {i !== activity.length - 1 && (
                                  <div className="absolute left-[5.5px] top-2.5 bottom-0 w-px bg-border group-hover:bg-border/80 transition-colors" />
                                )}
                                <div className={cn(
                                   "absolute left-[1.5px] top-2 w-2 h-2 rounded-full ring-4 ring-card",
                                   item.action.includes('SUCCESS') ? "bg-emerald-500" : 
                                   item.action.includes('FAILED') ? "bg-red-500" : "bg-indigo-500"
                                )} />
                                <div className="flex flex-col gap-1.5">
                                   <div className="flex items-center justify-between">
                                      <p className="font-bold text-foreground leading-none">{item.action.replace(/_/g, ' ')}</p>
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatDistanceToNow(new Date(item.created_at))} ago</span>
                                   </div>
                                   <div className="p-3 bg-muted/40 border border-border/50 rounded-lg text-xs text-muted-foreground font-mono leading-relaxed mt-1">
                                      {JSON.stringify(item.details)}
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="m-0">
              <InventorySection projectSlug={currentProject.slug} />
            </TabsContent>

            <TabsContent value="services" className="m-0">
              <ServicesSection />
            </TabsContent>

            <TabsContent value="telemetry" className="m-0">
              <LogsSection projectId={currentProject.id} />
            </TabsContent>

            <TabsContent value="compliance" className="m-0">
              <ComplianceSection projectId={currentProject.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  )
}
