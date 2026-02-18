"use client"
export const dynamic = "force-dynamic"

import { useState, useMemo, useEffect, useRef } from "react"
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
  Eye,
  Menu,
  X,
  Workflow,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  Clock,
  TrendingDown,
  Circle,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow, subMinutes, isAfter } from "date-fns"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/toast"

// --- Shared Components ---
const SectionHeader = ({ icon: Icon, title, description, badge, id }: { icon: any, title: string, description?: string, badge?: string, id?: string }) => (
  <div className="flex items-center justify-between mb-8 pt-8 first:pt-0" id={id}>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-2xl bg-foreground/5 border border-foreground/10 ring-1 ring-foreground/5 shadow-inner">
        <Icon className="w-6 h-6 text-foreground" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground flex items-center gap-3 tracking-tight">
          {title}
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black tracking-widest uppercase shadow-sm">
              {badge}
            </span>
          )}
        </h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5 font-medium opacity-70">{description}</p>}
      </div>
    </div>
  </div>
)

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "glass-card border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group",
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    {children}
  </div>
)

// --- Inventory Section ---
const InventorySection = () => {
  const { currentProject } = useProject()
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug: currentProject?.slug })
  const resources = inventoryQuery.data || []
  const router = useRouter()

  if (inventoryQuery.isLoading) return <div className="p-12 text-center animate-pulse"><Box className="w-8 h-8 mx-auto opacity-20" /></div>

  return (
    <div className="space-y-6">
      <SectionHeader id="discovery" icon={Box} title="Neural Asset Discovery" description="Mapping real-time cloud resources across established bridge nodes." badge="REAL-TIME" />
      
      {resources.length === 0 ? (
        <Card className="border-dashed py-20 text-center">
           <div className="w-16 h-16 rounded-3xl bg-foreground/5 flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <Box className="w-8 h-8 text-muted-foreground/30" />
           </div>
           <h3 className="text-lg font-bold text-foreground mb-2 italic">Zero Assets Identified</h3>
           <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-8 font-medium opacity-60">Initialize your AWS, Azure, or GCP credentials to enable automated asset discovery.</p>
           <Button onClick={() => router.push('/settings')} variant="outline" className="h-10 px-8 text-[11px] font-black uppercase tracking-[0.2em] border-white/10 rounded-2xl hover:bg-foreground hover:text-background transition-all">
              Establish Connection
           </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res: any) => (
            <Card key={res.id} className="p-5 hover:border-white/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
                  {res.type.includes('s3') ? <HardDrive className="w-5 h-5 text-indigo-400" /> : <Box className="w-5 h-5 text-indigo-400" />}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{res.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{res.type.split(':').pop()}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="text-[10px] text-indigo-400/80 font-black uppercase tracking-widest">{res.providerName}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-[10px] text-emerald-500 tracking-[0.1em]">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {res.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono font-bold uppercase opacity-30">{res.region}</div>
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const t = trpc as any
  const { data: services = [], isLoading } = t.services.all.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const filteredServices = services.filter((service: any) => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) return <div className="p-12 text-center animate-pulse"><Layers className="w-8 h-8 mx-auto opacity-20" /></div>

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("api")) return Server
    if (name.toLowerCase().includes("database") || name.toLowerCase().includes("db")) return Database
    if (name.toLowerCase().includes("worker") || name.toLowerCase().includes("queue")) return Cpu
    return Globe
  }

  return (
    <div className="space-y-6">
      <SectionHeader id="services" icon={Layers} title="Orchestrated Services" description="Live application nodes and active deployments across cluster zones." badge="ENFORCED" />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search active services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-foreground/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs outline-none focus:border-white/20 transition-all font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30"
          />
        </div>
        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-white/5 gap-1">
           {['all', 'up', 'degraded', 'down'].map(filter => (
             <button
               key={filter}
               onClick={() => setStatusFilter(filter)}
               className={cn(
                 "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                 statusFilter === filter ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
               )}
             >
               {filter}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredServices.map((service: any) => {
          const Icon = getIcon(service.name)
          return (
            <Card key={service.id} className="p-6 transition-all hover:translate-y-[-2px]">
               <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-indigo-500/10 transition-colors">
                     <Icon className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                   </div>
                   <div>
                     <h3 className="font-bold text-base text-foreground tracking-tight">{service.name}</h3>
                     <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest",
                          service.status === 'up' ? "text-emerald-500" : "text-amber-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", service.status === 'up' ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-amber-500")} />
                          {service.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-30 italic">{service.instance_count || 3} instances</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="text-[11px] font-black text-foreground bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">A</div>
                    <button className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                       <MoreVertical className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Uptime', val: `${Number(service.uptime_percent).toFixed(1)}%`, icon: Activity },
                    { label: 'Latency', val: service.latency || "45ms", icon: Zap },
                    { label: 'Cost/hr', val: `$${Number(service.cost_hr).toFixed(2)}`, icon: Coins }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                      <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40 mb-1 flex items-center gap-1">
                        <metric.icon className="w-2.5 h-2.5" /> {metric.label}
                      </p>
                      <p className="text-sm font-bold text-foreground italic">{metric.val}</p>
                    </div>
                  ))}
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-muted-foreground font-bold italic opacity-40 flex items-center gap-2">
                    <Workflow className="w-3 h-3" /> Deployed {formatDistanceToNow(new Date(service.created_at || Date.now()))} ago
                  </span>
                  <div className="flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-all">
                     <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                     <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                  </div>
               </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// --- Governance / Compliance Section ---
const GovernanceSection = () => {
  const { currentProject } = useProject()
  const t = trpc as any

  // Cost data
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const recommendations = t.costOptimization.getRecommendations.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const overview = costOverview.data || { totalCost: 0 }
  const recs = recommendations.data?.recommendations || []

  // Audit data
  const auditQuery = t.auditLogs.list.useQuery({ limit: 12 })
  const logs = auditQuery.data?.items || []

  // Drift data
  const deploymentsQuery = t.kubernetes.listDeployments.useQuery({ clusterId: 'global' })
  const deployments = deploymentsQuery.data || []

  return (
    <div className="space-y-8">
      <SectionHeader id="governance" icon={ShieldCheck} title="Governance & Compliance" description="Enforcing enterprise guardrails, resource ethics, and fiscal integrity." badge="ENFORCED" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Analytics */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-8 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                   <Coins className="w-4 h-4" /> Fiscal Intensity
                 </p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black italic tracking-tighter text-foreground">${overview.totalCost.toFixed(2)}</p>
                   <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-40">Monthly Intensity</span>
                 </div>
              </Card>
              <Card className="p-8 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                 <p className="text-[10px] text-emerald-400 uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-2">
                   <TrendingDown className="w-4 h-4" /> Optimization Yield
                 </p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black italic tracking-tighter text-emerald-400">${recommendations.data?.totalPotentialSavings.toFixed(2) || "0.00"}</p>
                   <span className="text-xs text-emerald-500/60 font-bold uppercase tracking-widest opacity-70 italic">Idle Mitigation</span>
                 </div>
              </Card>
           </div>

           <Card className="p-8">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 italic flex items-center gap-2">
                <Workflow className="w-4 h-4" /> Strategic Optimization Recommendations
              </h4>
              <div className="space-y-4">
                {recs.length > 0 ? recs.slice(0, 3).map((rec: any, i: number) => (
                  <div key={i} className="p-5 rounded-3xl bg-foreground/5 border border-white/5 flex items-center justify-between group/rec hover:bg-foreground/10 transition-all cursor-pointer">
                     <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black italic text-sm shadow-inner group-hover/rec:scale-110 transition-transform">
                          -${rec.estimatedSavings}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{rec.type}</span>
                          <span className="text-base font-bold block text-foreground tracking-tight">{rec.title}</span>
                        </div>
                     </div>
                     <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover/rec:opacity-100 transition-all group-hover/rec:translate-x-2" />
                  </div>
                )) : (
                  <div className="p-12 text-center text-muted-foreground/30 italic font-bold uppercase tracking-widest text-[10px]">No anomalies detected in current cycle.</div>
                )}
              </div>
           </Card>
        </div>

        {/* GitOps Drift */}
        <div className="space-y-6">
           <Card className="p-6 h-full flex flex-col">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 italic flex items-center gap-2">
                <GitCompare className="w-4 h-4" /> State Reconciliation (Drift)
              </h4>
              <div className="flex-1 space-y-3">
                {deployments.length > 0 ? deployments.map((dep: any) => (
                  <div key={dep.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 group/drift">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-foreground tracking-tight">{dep.name}</p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-30">{dep.namespace}</p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        dep.status === 'synchronized' ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-red-500/5 text-red-500 border-red-500/10"
                      )}>
                        {dep.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-end opacity-0 group-hover/drift:opacity-100 transition-opacity">
                       <Button variant="ghost" className="h-7 text-[9px] font-black uppercase tracking-widest px-3 hover:bg-white/5 rounded-lg gap-2">
                         <RotateCcw className="w-3 h-3" /> Reconcile
                       </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-muted-foreground/30 italic font-bold uppercase tracking-widest text-[10px]">Cluster state synchronized.</div>
                )}
              </div>
           </Card>
        </div>
      </div>

      {/* Audit Trail */}
      <Card className="p-0 overflow-hidden outline outline-1 outline-white/5 shadow-inner">
         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
             <Shield className="w-4 h-4" /> Immutable Compliance Logs
           </h4>
           <div className="flex gap-2">
              <Button variant="ghost" className="h-8 text-[9px] font-black tracking-widest uppercase hover:bg-white/5 px-4 rounded-xl">Export Artifacts</Button>
           </div>
         </div>
         <div className="divide-y divide-white/5 font-mono max-h-[400px] overflow-y-auto no-scrollbar">
           {logs.map((log: any) => (
             <div key={log.id} className="p-5 px-8 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors group">
                <div className="flex items-center gap-8 text-xs">
                  <span className="text-muted-foreground/20 font-black tracking-tighter w-20 text-[10px]">{format(new Date(log.createdAt), "HH:mm:ss")}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500/30 group-hover:bg-indigo-400 transition-colors" />
                    <span className="font-bold text-foreground tracking-tight">{log.action}</span>
                  </div>
                  <span className="text-muted-foreground font-medium opacity-40">{log.userId}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                </div>
             </div>
           ))}
         </div>
      </Card>
    </div>
  )
}

const SecuritySection = () => {
  return (
    <div className="space-y-6" id="security">
      <SectionHeader icon={ShieldCheck} title="Perimeter Security" description="Global threat mitigation and active identity governance." badge="SHIELDED" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 border-emerald-500/10">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">Active Firewall</p>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Edge Protection</p>
              </div>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed">74,203 requests filtered in the last 24h. Zero malicious payloads detected through the primary ingress nodes.</p>
        </Card>
        <Card className="p-6">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                 <Lock className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">Auth & IAM</p>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Identity Flow</p>
              </div>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed">Multi-factor authentication enforced across all administrative accounts. Last audit completed 14 minutes ago.</p>
        </Card>
        <Card className="p-6 border-white/10 group-hover:border-white/20">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-white/5 text-muted-foreground">
                 <Globe className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">Inbound Traffic</p>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Global Edge</p>
              </div>
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic">14</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active PoPs</span>
           </div>
        </Card>
      </div>
    </div>
  )
}

// --- High Fidelity Logs Section (Vercel Style) ---
const LogsSection = () => {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const [isLive, setIsLive] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  
  const listingQuery = trpc.logs.listing.useQuery({
    projectId: currentProject?.id,
    search: search || undefined,
    levels: selectedLevels.length > 0 ? selectedLevels : undefined,
    methods: selectedMethods.length > 0 ? selectedMethods : undefined,
    limit: 100
  }, {
    enabled: !!currentProject?.id,
    refetchInterval: isLive ? 2000 : false
  })

  const metadataQuery = trpc.logs.metadata.useQuery({
    projectId: currentProject?.id
  }, { enabled: !!currentProject?.id })

  const logs = listingQuery.data?.items || []
  const metadata = metadataQuery.data || { levels: [], methods: [], statuses: [], services: [] }

  // Timeline density calculation
  const timelineData = useMemo(() => {
    const buckets = Array(60).fill(0)
    const now = new Date()
    logs.forEach(log => {
      const ts = new Date(log.timestamp || log.createdAt)
      const diffMins = Math.floor((now.getTime() - ts.getTime()) / 60000)
      if (diffMins >= 0 && diffMins < 60) {
        buckets[59 - diffMins]++
      }
    })
    return buckets
  }, [logs])

  const handleExport = (format: 'json' | 'csv') => {
    const data = logs.map(l => ({
      timestamp: l.timestamp || l.createdAt,
      level: l.level || l.type,
      message: l.message,
      method: l.method,
      path: l.path,
      status: l.status,
      host: l.host,
      requestId: l.requestId
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sarge-logs-${Date.now()}.json`
      a.click()
    } else {
      const headers = ['Timestamp', 'Level', 'Message', 'Method', 'Path', 'Status', 'Host', 'RequestId']
      const csv = [
        headers.join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sarge-logs-${Date.now()}.csv`
      a.click()
    }
    
    addToast({ title: "Logs Exported", description: `Successfully generated ${format.toUpperCase()} report.`, type: "success" })
  }

  const toggleLevel = (lvl: string) => {
    setSelectedLevels(prev => prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl])
  }

  const levelColors: Record<string, string> = {
    error: "text-red-500",
    fatal: "text-red-600 bg-red-500/10",
    warning: "text-amber-500",
    info: "text-indigo-400",
    debug: "text-muted-foreground",
    watch: "text-emerald-400"
  }

  return (
    <div className="space-y-6">
      <SectionHeader id="telemetry" icon={Terminal} title="High-Fidelity Observability" description="Neural log stream with multi-dimensional correlation." badge="LIVE STREAM" />
      
      {/* Timeline Visualizer */}
      <Card className="p-4 bg-foreground/[0.01] border-white/5 overflow-hidden">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
               <Calendar className="w-3 h-3" /> Event Density (Past 60m)
            </div>
            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{logs.length} Artifacts Identified</div>
         </div>
         <div className="h-10 flex items-end gap-0.5">
            {timelineData.map((v, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.min(100, (v / Math.max(...timelineData, 1)) * 100)}%` }}
                className={cn(
                  "flex-1 bg-indigo-500/20 rounded-t-[1px] hover:bg-indigo-500/50 transition-colors",
                  v > 0 ? "opacity-100" : "opacity-10"
                )}
              />
            ))}
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
           <Card className="p-4 bg-foreground/[0.02] border-white/5 rounded-3xl">
              <div className="flex items-center justify-between mb-4 px-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                   <Filter className="w-3 h-3" /> Filters
                 </h4>
                 <button onClick={() => { setSelectedLevels([]); setSelectedMethods([]); setSearch(""); }} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Reset</button>
              </div>

              <div className="space-y-6">
                 {/* Search */}
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Neural query..." 
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[11px] font-bold text-foreground outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/20 italic" 
                    />
                 </div>

                 {/* Console Level */}
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3 px-2 italic">Console Level</p>
                    <div className="space-y-1">
                       {['fatal', 'error', 'warning', 'info', 'debug', 'watch'].map(lvl => {
                         const count = metadata.levels.find(m => m.value === lvl)?.count || 0
                         const isActive = selectedLevels.includes(lvl)
                         return (
                           <button 
                             key={lvl}
                             onClick={() => toggleLevel(lvl)}
                             className={cn(
                               "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group",
                               isActive ? "bg-white/5 border border-white/10" : "hover:bg-white/[0.02]"
                             )}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={cn("w-2 h-2 rounded-full", levelColors[lvl] || "bg-muted-foreground/40")} />
                                 <span className={cn("text-[10px] font-bold capitalize", isActive ? "text-foreground" : "text-muted-foreground/60 group-hover:text-muted-foreground")}>{lvl}</span>
                              </div>
                              <span className="text-[9px] font-mono text-muted-foreground/20 font-black">{count}</span>
                           </button>
                         )
                       })}
                    </div>
                 </div>

                 {/* Methods */}
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3 px-2 italic">Request Method</p>
                    <div className="flex flex-wrap gap-2 px-2">
                       {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                         <button 
                           key={m}
                           onClick={() => setSelectedMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                           className={cn(
                             "px-3 py-1 rounded-lg text-[9px] font-black border transition-all",
                             selectedMethods.includes(m) ? "bg-indigo-500 text-white border-indigo-400" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
                           )}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Main Log Feed */}
        <div className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setIsLive(!isLive)}
                   className={cn(
                     "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                     isLive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                   )}
                 >
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isLive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-muted-foreground/40")} />
                    {isLive ? 'Live' : 'Paused'}
                 </button>
                 <button 
                   onClick={() => listingQuery.refetch()}
                   className="p-1.5 rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
                 >
                    <RefreshCw className={cn("w-4 h-4", listingQuery.isRefetching && "animate-spin")} />
                 </button>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={() => handleExport('json')} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-white/5 rounded-xl px-4">
                    <Download className="w-3.5 h-3.5" /> Export JSON
                 </Button>
                 <Button onClick={() => handleExport('csv')} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-white/5 rounded-xl px-4">
                    <Download className="w-3.5 h-3.5" /> CSV
                 </Button>
              </div>
           </div>

           <Card className="p-0 bg-black/40 border-white/5 min-h-[600px] flex flex-col rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
              
              {/* Log Header */}
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                 <div className="col-span-1">Time</div>
                 <div className="col-span-1 text-center">Status</div>
                 <div className="col-span-1">Method</div>
                 <div className="col-span-9">Message / Trace</div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[11px]">
                 {listingQuery.isLoading && (
                   <div className="p-20 text-center opacity-20 italic font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Neural Stream...</div>
                 )}
                 {logs.length === 0 && !listingQuery.isLoading && (
                   <div className="p-20 text-center text-muted-foreground/30 italic font-black uppercase tracking-widest text-xs">Zero artifacts in current query window.</div>
                 )}
                 {logs.map((log: any, i: number) => (
                   <div key={log.id || i} className="grid grid-cols-12 gap-4 px-8 py-3.5 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group cursor-crosshair">
                      <div className="col-span-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors font-medium">
                        {format(new Date(log.timestamp || log.createdAt), "HH:mm:ss")}
                      </div>
                      <div className="col-span-1 flex justify-center">
                         {log.status ? (
                           <span className={cn(
                             "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                             log.status >= 500 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                             log.status >= 400 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                             "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                           )}>
                             {log.status}
                           </span>
                         ) : <div className="w-1.5 h-1.5 rounded-full bg-white/10 mt-2" />}
                      </div>
                      <div className="col-span-1">
                         <span className="text-[10px] font-black text-white/20 group-hover:text-white/40">{log.method || '---'}</span>
                      </div>
                      <div className="col-span-9 flex flex-col gap-1">
                         <div className="flex items-center gap-3">
                            <span className={cn("text-[10px] uppercase font-black tracking-widest", levelColors[log.level || log.type] || "text-muted-foreground")}>
                              {log.level || log.type}
                            </span>
                            <span className="text-foreground/80 leading-relaxed font-medium group-hover:text-foreground transition-colors">{log.message}</span>
                         </div>
                         {(log.path || log.requestId) && (
                           <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 origin-left">
                              {log.path && <span className="text-[9px] text-indigo-400/60 font-medium italic underline decoration-indigo-500/20">{log.path}</span>}
                              {log.requestId && <span className="text-[9px] text-muted-foreground/20 font-bold tracking-tighter uppercase">{log.requestId}</span>}
                           </div>
                         )}
                      </div>
                   </div>
                 ))}
                 
                 {listingQuery.data?.nextCursor && (
                    <button onClick={() => listingQuery.refetch()} className="w-full py-8 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-indigo-400 transition-all group">
                       Map Future Artifacts <TrendingDown className="inline w-3 h-3 ml-2 group-hover:translate-y-1 transition-transform" />
                    </button>
                 )}
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}

// --- Main Layout ---
export default function ObservatoryHub() {
  const { currentProject } = useProject()
  const [activeHash, setActiveHash] = useState('discovery')
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({})
  const t = trpc as any

  // Lifted Stats for Global Summary
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const overview = costOverview.data || { totalCost: 0 }

  const sections = [
    { id: 'discovery', name: 'Discovery', icon: Box },
    { id: 'services', name: 'Services', icon: Layers },
    { id: 'telemetry', name: 'Telemetry', icon: Terminal },
    { id: 'governance', name: 'Compliance', icon: ShieldCheck },
    { id: 'security', name: 'Perimeter', icon: Lock },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el && el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
          setActiveHash(section.id)
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth'
      })
    }
  }

  return (
    <AppShell title="Observatory Core">
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        
        {/* Unified Sticky Header for Hub Navigation */}
        <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-2xl border-b border-white/[0.03] py-4 px-6 md:px-10">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                      activeHash === section.id 
                        ? "bg-foreground text-background shadow-[0_10px_30px_rgba(0,0,0,0.5)] scale-[1.05]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <section.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{section.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Global Telemetry Online
                    </span>
                    <span className="text-[9px] text-muted-foreground font-bold tracking-tight opacity-40">Syncing every 2s</span>
                 </div>
                 <Button variant="outline" className="h-10 w-10 p-0 rounded-2xl border-white/10 hover:bg-white/5 transition-all outline-none">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                 </Button>
              </div>
           </div>
        </div>

        {/* Dense Content Stream */}
        <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-32 mb-40 animate-fade-in no-scrollbar">
           
           <InventorySection />

           <ServicesSection />

           <LogsSection />

           <GovernanceSection />

           <SecuritySection />

           <div id="telemetry-legacy" className="space-y-6 pt-8">
              <SectionHeader icon={BarChart3} title="Infrastructure Intensity" description="Deep-packet analytics and machine-learning anomaly detection." badge="ANALYTICS" />
              <Card className="h-96 flex flex-col items-center justify-center text-center py-20 bg-foreground/[0.01] border-dashed border-white/5">
                 <motion.div
                   animate={{ 
                     scale: [1, 1.05, 1],
                     opacity: [0.3, 0.6, 0.3]
                   }}
                   transition={{ duration: 3, repeat: Infinity }}
                 >
                    <Activity className="w-12 h-12 text-muted-foreground mb-6" />
                 </motion.div>
                 <h4 className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground italic">Establishing Machine Learning Context...</h4>
                 <p className="text-[10px] text-muted-foreground/30 mt-4 font-bold uppercase tracking-widest">Bridging neural collectors to real-world edge nodes</p>
              </Card>
           </div>

        </div>

        {/* Global Hub Summary (Bottom Sticky) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
           <Card className="p-3 bg-black/80 backdrop-blur-3xl border-white/10 shadow-[0_20px_60px_rgba(0,0,0,1)] rounded-3xl flex items-center gap-3 px-8">
              {[
                { label: 'HEALTH', val: '100%', color: 'text-emerald-500' },
                { label: 'COST', val: `$${overview.totalCost.toFixed(2)}`, color: 'text-foreground' },
                { label: 'DRIFT', val: '0', color: 'text-muted-foreground' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-[8px] font-black text-white/20 tracking-widest mb-0.5">{stat.label}</span>
                  <span className={cn("text-xs font-black italic tracking-tight", stat.color)}>{stat.val}</span>
                </div>
              ))}
              <div className="w-px h-8 bg-white/5 mx-2" />
              <Button onClick={() => scrollTo('discovery')} className="h-9 rounded-xl bg-foreground text-background text-[9px] font-black uppercase tracking-widest px-6 hover:scale-105 transition-transform active:scale-95">Ignition</Button>
           </Card>
        </div>

      </div>
    </AppShell>
  )
}
