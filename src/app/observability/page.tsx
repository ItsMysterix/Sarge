"use client"
export const dynamic = "force-dynamic"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Activity, 
  Terminal, 
  Map, 
  Cpu,
  Server,
  Gauge,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Globe,
  Database,
  Lock,
  BarChart3,
  Search,
  Box,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Zap,
  HardDrive,
  Info,
  Layers,
  Plus,
  Coins,
  GitCompare,
  Moon,
  Sun,
  Shield,
  RefreshCcw,
  RefreshCw,
  MoreVertical,
  RotateCcw,
  Settings,
  Play,
  ArrowRight,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"

// --- Shared Components ---
const SectionHeader = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description?: string, badge?: string }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 ring-1 ring-foreground/5">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold tracking-widest uppercase">
              {badge}
            </span>
          )}
        </h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  </div>
)

// --- Inventory Tab ---
const InventoryTab = () => {
  const { currentProject } = useProject()
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug: currentProject?.slug })
  const resources = inventoryQuery.data || []
  const router = useRouter()

  if (inventoryQuery.isLoading) return <LoadingScreen title="Discovering Assets" subtitle="Scanning cloud resources..." />

  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHeader icon={Box} title="Cloud Inventory" description="All resources discovered across connected accounts." badge="REAL-TIME" />
      
      {resources.length === 0 ? (
        <div className="glass-card border border-dashed border-white/10 rounded-2xl p-12 text-center">
           <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Box className="w-6 h-6 text-muted-foreground" />
           </div>
           <h3 className="font-semibold text-foreground mb-1">No Resources Discovered</h3>
           <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6">Connect your AWS, Azure, or GCP accounts to start discovery.</p>
           <Button onClick={() => router.push('/settings')} variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-widest border-white/10 rounded-full">
              Establish Connection
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res: any) => (
            <div key={res.id} className="glass-card border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  {res.type.includes('s3') ? <HardDrive className="w-4 h-4 text-indigo-400" /> : <Box className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground truncate max-w-[180px]">{res.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">{res.type}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] text-indigo-400/80 font-bold uppercase">{res.providerName}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[10px] text-emerald-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {res.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">{res.region}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Services Tab ---
const ServicesTab = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const t = trpc as any
  const { data: services = [], isLoading, refetch } = t.services.all.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const filteredServices = services.filter((service: any) => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) return <LoadingScreen title="Synchronizing Services" subtitle="Fetching real-time infrastructure status..." />

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("api")) return Server
    if (name.toLowerCase().includes("database") || name.toLowerCase().includes("db")) return Database
    if (name.toLowerCase().includes("worker") || name.toLowerCase().includes("queue")) return Cpu
    return Globe
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader icon={Layers} title="Infrastructure Services" description="Orchestrated application services and nodes." />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-white/30 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
           {['all', 'up', 'degraded', 'down'].map(filter => (
             <button
               key={filter}
               onClick={() => setStatusFilter(filter)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                 statusFilter === filter ? "bg-foreground text-background border-foreground" : "bg-card/30 border-white/5 text-muted-foreground"
               )}
             >
               {filter}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service: any) => {
          const Icon = getIcon(service.name)
          return (
            <div key={service.id} className="glass-card border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all group">
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                     <Icon className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-foreground">{service.name}</h3>
                     <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{service.status} • {service.instance_count || 3} instances</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-foreground bg-white/5 px-2 py-1 rounded-lg border border-white/10">A</span>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                       <MoreVertical className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Uptime</p>
                    <p className="text-xs font-bold text-foreground">{Number(service.uptime_percent).toFixed(1)}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Latency</p>
                    <p className="text-xs font-bold text-foreground">{service.latency || "45ms"}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Cost/hr</p>
                    <p className="text-xs font-bold text-foreground">${Number(service.cost_hr).toFixed(2)}</p>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[9px] text-muted-foreground font-medium italic opacity-40">Deployed {formatDistanceToNow(new Date(service.created_at || Date.now()))} ago</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                     <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Governance / Audit Tab ---
const GovernanceTab = () => {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  const [gvTab, setGvTab] = useState<'cost' | 'audit' | 'drift'>('cost')

  // Cost data
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const recommendations = t.costOptimization.getRecommendations.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const overview = costOverview.data || { totalCost: 0 }
  const recs = recommendations.data?.recommendations || []

  // Audit data
  const auditQuery = t.auditLogs.list.useQuery({ limit: 15 }, { enabled: gvTab === 'audit' })
  const logs = auditQuery.data?.items || []

  // Drift data
  const deploymentsQuery = t.kubernetes.listDeployments.useQuery({ clusterId: 'global' }, { enabled: gvTab === 'drift' })
  const deployments = deploymentsQuery.data || []

  if (costOverview.isLoading || (gvTab === 'audit' && auditQuery.isLoading) || (gvTab === 'drift' && deploymentsQuery.isLoading)) {
     return <LoadingScreen title="Accessing Compliance Data" subtitle="Reconciling cloud state..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader icon={ShieldCheck} title="Governance & Compliance" description="Enterprise guardrails, cost controls, and audit trails." badge="ENFORCED" />
      
      <div className="flex bg-muted/20 p-1 rounded-2xl border border-white/5 mb-6 w-fit">
        {[
          { icon: Coins, name: 'Cost', val: 'cost' },
          { icon: GitCompare, name: 'Drift', val: 'drift' },
          { icon: Shield, name: 'Audit', val: 'audit' }
        ].map(item => (
          <button
            key={item.val}
            onClick={() => setGvTab(item.val as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
              gvTab === item.val ? "bg-foreground text-background shadow-lg" : "text-muted-foreground/50 hover:text-muted-foreground"
            )}
          >
            <item.icon className="w-3.5 h-3.5" /> {item.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={gvTab}
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.02 }}
           transition={{ duration: 0.2 }}
        >
          {gvTab === 'cost' && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 glass-card border border-white/5 rounded-3xl">
                     <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Project Total Spend</p>
                     <p className="text-4xl font-black italic tracking-tighter">${overview.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="p-6 glass-card border border-emerald-500/20 bg-emerald-500/5 rounded-3xl">
                     <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-2">Savings Potential</p>
                     <p className="text-4xl font-black italic tracking-tighter text-emerald-400">${recommendations.data?.totalPotentialSavings.toFixed(2) || "0.00"}</p>
                  </div>
               </div>
               <div className="glass-card border border-white/5 rounded-3xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 italic">Active Recommendations</h4>
                  <div className="space-y-3">
                    {recs.slice(0, 3).map((rec: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Potential Saving: -${rec.estimatedSavings}</span>
                            <span className="text-sm font-bold">{rec.title}</span>
                         </div>
                         <ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {gvTab === 'drift' && (
            <div className="glass-card border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 italic">Resource</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 italic text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 italic text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {deployments.map((dep: any) => (
                    <tr key={dep.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-foreground">{dep.name}</p>
                        <p className="text-[9px] text-muted-foreground opacity-60">{dep.namespace}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                          dep.status === 'synchronized' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {gvTab === 'audit' && (
            <div className="glass-card border border-white/5 rounded-3xl overflow-hidden">
               <div className="divide-y divide-white/5">
                 {logs.map((log: any) => (
                   <div key={log.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition-colors font-mono group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                           <Shield className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-foreground">{log.action}</span>
                           <span className="text-[9px] text-muted-foreground uppercase opacity-40">{log.userId} • {format(new Date(log.createdAt), "HH:mm:ss")}</span>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer" />
                   </div>
                 ))}
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// --- Security Tab ---
const SecurityTab = () => {
  const { currentProject } = useProject()
  const alertsQuery = trpc.commandCenter.getSecurityAlerts.useQuery({ projectSlug: currentProject?.slug })
  const alerts = alertsQuery.data || []

  if (alertsQuery.isLoading) return <LoadingScreen title="Auditing Security" subtitle="Analyzing cloud posture..." />

  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHeader icon={ShieldCheck} title="Security & Governance" description="Active guardrails and cloud posture findings." badge="AUDIT" />
      
      {alerts.length === 0 ? (
        <div className="glass-card border border-dashed border-white/10 rounded-2xl p-12 text-center">
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
           </div>
           <h3 className="font-semibold text-foreground mb-1">System Hardened</h3>
           <p className="text-xs text-muted-foreground max-w-xs mx-auto">No critical vulnerabilities or posture drifts detected in your connected accounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div key={alert.id} className={cn(
              "p-4 rounded-xl border flex items-center justify-between group",
              alert.severity === 'critical' ? "bg-red-500/5 border-red-500/20" : 
              alert.severity === 'high' ? "bg-orange-500/5 border-orange-500/20" : "bg-white/5 border-white/10"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2.5 rounded-lg border",
                  alert.severity === 'critical' || alert.severity === 'high' ? "bg-red-500/10 border-red-500/20" : "bg-foreground/5 border-foreground/10"
                )}>
                  <AlertTriangle className={cn("w-4 h-4", alert.severity === 'critical' || alert.severity === 'high' ? "text-red-400" : "text-orange-400")} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {alert.title}
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                      alert.severity === 'critical' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                    )}>
                      {alert.severity}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xl">{alert.description}</p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase bg-white/5 px-2 py-1 rounded-md">
                {alert.providerName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Domains Tab ---
const DomainsTab = () => {
  const { currentProject } = useProject()
  const domainsQuery = trpc.commandCenter.getDomains.useQuery({ projectSlug: currentProject?.slug })
  const router = useRouter()

  if (domainsQuery.isLoading) return <LoadingScreen title="Resolving Domains" subtitle="Checking edge certificate status..." />

  return (
    <div className="space-y-6 animate-fade-in">
       <SectionHeader icon={Globe} title="Domain & SSL Control" description="Managed domains and edge certificate status." />
       
       {!domainsQuery.data || domainsQuery.data.length === 0 ? (
         <div className="glass-card border border-dashed border-white/10 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
               <Globe className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Active Domains</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6">Register or point your external domains to Sarge to enable SSL and Edge routing.</p>
            <Button onClick={() => router.push('/settings')} variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-widest border-white/10 rounded-full">
               Configure Domains
            </Button>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainsQuery.data?.map((d: any, i: number) => (
              <div key={i} className="glass-card border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{d.domain}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> SSL ACTIVE
                       </span>
                       <span className="w-1 h-1 rounded-full bg-white/10" />
                       <span className="text-[10px] text-muted-foreground uppercase">{d.provider}</span>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
              </div>
            ))}
         </div>
       )}
    </div>
  )
}

// --- Main Layout ---
export default function ObservatoryHub() {
  const [activeTab, setActiveTab] = useState('inventory')
  const { currentProject } = useProject()

  const tabs = [
    { id: 'inventory', name: 'Discovery', icon: Box },
    { id: 'services', name: 'Services', icon: Layers },
    { id: 'governance', name: 'Governance', icon: ShieldCheck },
    { id: 'metrics', name: 'Telemetry', icon: BarChart3 },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'domains', name: 'Network', icon: Globe },
  ]

  return (
    <AppShell title="Observability Hub">
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in focus:outline-none">
        
        <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-muted/10 w-full justify-start border border-border/50 rounded-2xl p-1 mb-10 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap",
                  "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-xl",
                  "text-muted-foreground hover:text-foreground hover:bg-white/5 data-[state=active]:hover:bg-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="focus:outline-none"
            >
              <TabsContent value="inventory" className="mt-0 focus-visible:outline-none">
                <InventoryTab />
              </TabsContent>
              
              <TabsContent value="services" className="mt-0 focus-visible:outline-none">
                <ServicesTab />
              </TabsContent>

              <TabsContent value="governance" className="mt-0 focus-visible:outline-none">
                <GovernanceTab />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                <SecurityTab />
              </TabsContent>
              
              <TabsContent value="domains" className="mt-0 focus-visible:outline-none">
                <DomainsTab />
              </TabsContent>
              
              {['metrics'].map(tabId => (
                <TabsContent key={tabId} value={tabId} className="mt-0 focus-visible:outline-none">
                  <div className="p-20 text-center space-y-4 glass-card border border-white/5 rounded-3xl animate-pulse">
                     <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Establishing secure telemetry channels...</p>
                  </div>
                </TabsContent>
              ))}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </AppShell>
  )
}
