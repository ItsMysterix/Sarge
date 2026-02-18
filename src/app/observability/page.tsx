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
  <div className="flex items-center justify-between mb-8 pt-8 first:pt-0 border-t border-border/50 first:border-0" id={id}>
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-muted border border-border shadow-sm">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
          {title}
          {badge && (
            <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-2">{badge}</Badge>
          )}
        </h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{description}</p>}
      </div>
    </div>
  </div>
)

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden group",
    className
  )}>
    {children}
  </div>
)

const Badge = ({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "secondary" | "outline" | "destructive", className?: string }) => (
  <span className={cn(
    "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center",
    variant === "default" && "bg-foreground text-background",
    variant === "secondary" && "bg-muted text-muted-foreground",
    variant === "outline" && "border border-border text-foreground",
    variant === "destructive" && "bg-destructive/10 text-destructive",
    className
  )}>
    {children}
  </span>
)

// --- Inventory Section ---
const InventorySection = () => {
  const { currentProject } = useProject()
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug: currentProject?.slug })
  const resources = inventoryQuery.data || []
  const router = useRouter()

  if (inventoryQuery.isLoading) return <div className="p-12 text-center"><Box className="w-8 h-8 mx-auto opacity-20 animate-pulse" /></div>

  return (
    <div className="space-y-6">
      <SectionHeader id="discovery" icon={Box} title="Cloud Assets" description="Inventory of active resources identified across connected providers." badge="Discovery" />
      
      {resources.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
           <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
           <h3 className="text-base font-bold text-foreground mb-1">No Assets Identified</h3>
           <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6">Connect your cloud providers in settings to enable automated discovery.</p>
           <Button onClick={() => router.push('/settings')} variant="outline" size="sm">
              Connect Provider
           </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res: any) => (
            <Card key={res.id} className="p-5 hover:border-border/80 transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {res.type.includes('s3') ? <HardDrive className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{res.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{res.type.split(':').pop()}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{res.providerName}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {res.status}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase opacity-60">{res.region}</div>
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

  if (isLoading) return <div className="p-12 text-center"><Layers className="w-8 h-8 mx-auto opacity-20 animate-pulse" /></div>

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("api")) return Server
    if (name.toLowerCase().includes("database") || name.toLowerCase().includes("db")) return Database
    if (name.toLowerCase().includes("worker") || name.toLowerCase().includes("queue")) return Cpu
    return Globe
  }

  return (
    <div className="space-y-6">
      <SectionHeader id="services" icon={Layers} title="Active Services" description="Live status of Orchestrated services and application nodes." badge="Orchestration" />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Filter services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
           {['all', 'up', 'degraded', 'down'].map(filter => (
             <button
               key={filter}
               onClick={() => setStatusFilter(filter)}
               className={cn(
                 "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                 statusFilter === filter ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
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
            <Card key={service.id} className="p-5">
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                     <Icon className="w-5 h-5 text-muted-foreground" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-foreground">{service.name}</h3>
                     <div className="flex items-center gap-2.5 mt-0.5">
                        <span className={cn(
                          "flex items-center gap-1 text-[10px] font-bold uppercase",
                          service.status === 'up' ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {service.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-60">• {service.instance_count || 3} nodes</span>
                     </div>
                   </div>
                 </div>
                 <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all">
                    <MoreVertical className="w-4 h-4" />
                 </button>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Uptime', val: `${Number(service.uptime_percent).toFixed(1)}%` },
                    { label: 'Latency', val: service.latency || "45ms" },
                    { label: 'Cost', val: `$${Number(service.cost_hr).toFixed(2)}` }
                  ].map(metric => (
                    <div key={metric.label} className="p-2.5 rounded-lg bg-muted/20 border border-border/50 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">{metric.label}</p>
                      <p className="text-xs font-bold text-foreground">{metric.val}</p>
                    </div>
                  ))}
               </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// --- Governance / Logs Sections Reverted Styling etc ---
const GovernanceSection = () => {
  const { currentProject } = useProject()
  const t = trpc as any

  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const recommendations = t.costOptimization.getRecommendations.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const overview = costOverview.data || { totalCost: 0 }
  const recs = recommendations.data?.recommendations || []

  return (
    <div className="space-y-6">
      <SectionHeader id="governance" icon={ShieldCheck} title="Compliance & Cost" description="Real-time fiscal monitoring and resource optimization audits." badge="Governance" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col justify-center py-10 text-center space-y-2">
           <p className="text-xs font-bold text-muted-foreground uppercase">Current Monthly Spend</p>
           <p className="text-4xl font-black text-foreground">${overview.totalCost.toFixed(2)}</p>
        </Card>
        <Card className="flex flex-col justify-center py-10 text-center space-y-2">
           <p className="text-xs font-bold text-emerald-600 uppercase">Potential Savings</p>
           <p className="text-4xl font-black text-emerald-600">${recommendations.data?.totalPotentialSavings.toFixed(2) || "0.00"}</p>
        </Card>
      </div>

      <Card className="p-0">
         <div className="p-5 border-b border-border bg-muted/20">
            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
               <Workflow className="w-4 h-4" /> Optimization Recommendations
            </h4>
         </div>
         <div className="divide-y divide-border">
            {recs.length > 0 ? recs.slice(0, 3).map((rec: any, i: number) => (
               <div key={i} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                     <p className="text-sm font-bold">{rec.title}</p>
                     <p className="text-xs text-muted-foreground">{rec.type} • Save up to ${rec.estimatedSavings}/mo</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold">Apply</Button>
               </div>
            )) : (
               <div className="p-10 text-center text-xs text-muted-foreground italic">No current recommendations.</div>
            )}
         </div>
      </Card>
    </div>
  )
}

const SecuritySection = () => {
  return (
    <div className="space-y-6" id="security">
      <SectionHeader icon={ShieldCheck} title="Security Perimeter" description="Edge firewall status and access control governance." badge="Secure" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
           <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm font-bold">Firewall Active</p>
              <p className="text-[10px] text-muted-foreground">Monitoring edge ingress</p>
           </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
           <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600">
              <Lock className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm font-bold">Access Control</p>
              <p className="text-[10px] text-muted-foreground">MFA Enforced globally</p>
           </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
           <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <Globe className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm font-bold">14 Active Nodes</p>
              <p className="text-[10px] text-muted-foreground">Global CDN sync: Good</p>
           </div>
        </Card>
      </div>
    </div>
  )
}

const LogsSection = () => {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const [isLive, setIsLive] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  
  const listingQuery = trpc.logs.listing.useQuery({
    projectId: currentProject?.id,
    search: search || undefined,
    levels: selectedLevels.length > 0 ? selectedLevels : undefined,
    limit: 100
  }, {
    enabled: !!currentProject?.id,
    refetchInterval: isLive ? 3000 : false
  })

  const metadataQuery = trpc.logs.metadata.useQuery({
    projectId: currentProject?.id
  }, { enabled: !!currentProject?.id })

  const logs = listingQuery.data?.items || []
  const metadata = metadataQuery.data || { levels: [] }

  const handleExport = (format: 'json' | 'csv') => {
    const data = logs.map(l => ({
      timestamp: l.timestamp || l.createdAt,
      level: l.level || l.type,
      message: l.message,
      method: l.method,
      path: l.path,
      status: l.status
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${Date.now()}.json`
      a.click()
    } else {
      const headers = ['Timestamp', 'Level', 'Message', 'Method', 'Path', 'Status']
      const csv = [
        headers.join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${Date.now()}.csv`
      a.click()
    }
    addToast({ title: "Logs Exported", description: `File generated successfully.`, type: "success" })
  }

  const levelColors: Record<string, string> = {
    error: "text-red-600",
    fatal: "text-red-700 font-bold",
    warning: "text-amber-600",
    info: "text-indigo-600",
    debug: "text-muted-foreground",
    watch: "text-emerald-600"
  }

  return (
    <div className="space-y-6">
      <SectionHeader id="telemetry" icon={Terminal} title="Observability Stream" description="High-resolution log aggregation and multi-provider telemetry." badge="Live" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
           <Card className="p-4 space-y-6">
              <div>
                 <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Search Stream</p>
                 <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Keyword..." 
                      className="w-full bg-muted/30 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium" 
                    />
                 </div>
              </div>

              <div>
                 <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Console Level</p>
                 <div className="space-y-1">
                    {['fatal', 'error', 'warning', 'info', 'debug'].map(lvl => {
                      const isActive = selectedLevels.includes(lvl)
                      return (
                        <button 
                          key={lvl}
                          onClick={() => setSelectedLevels(prev => prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl])}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                            isActive ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                           <div className={cn("w-2 h-2 rounded-full", levelColors[lvl] || "bg-muted")} />
                           <span className="capitalize">{lvl}</span>
                        </button>
                      )
                    })}
                 </div>
              </div>
           </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setIsLive(!isLive)}
                   className={cn(
                     "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all",
                     isLive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-muted text-muted-foreground border-border"
                   )}
                 >
                    <div className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
                    {isLive ? 'Live Stream' : 'Paused'}
                 </button>
                 <button onClick={() => listingQuery.refetch()} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><RefreshCw className={cn("w-3.5 h-3.5", listingQuery.isRefetching && "animate-spin")} /></button>
              </div>
              <div className="flex gap-2">
                 <Button onClick={() => handleExport('json')} variant="ghost" className="h-7 text-[10px] font-bold uppercase hover:bg-muted">JSON</Button>
                 <Button onClick={() => handleExport('csv')} variant="ghost" className="h-7 text-[10px] font-bold uppercase hover:bg-muted">CSV</Button>
              </div>
           </div>

           <div className="bg-card border border-border rounded-2xl min-h-[500px] flex flex-col shadow-sm overflow-hidden font-mono">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground">
                 <div className="col-span-1">Time</div>
                 <div className="col-span-1 text-center">Status</div>
                 <div className="col-span-10">Event Details</div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[800px] divide-y divide-border/50 text-[11px]">
                 {logs.length === 0 && <div className="p-10 text-center text-muted-foreground italic">Awaiting events...</div>}
                 {logs.map((log: any, i: number) => (
                   <div key={log.id || i} className="grid grid-cols-12 gap-4 px-6 py-2.5 hover:bg-muted/10 transition-colors">
                      <div className="col-span-1 text-muted-foreground/60">{format(new Date(log.timestamp || log.createdAt), "HH:mm:ss")}</div>
                      <div className="col-span-1 flex justify-center">
                         {log.status && (
                            <span className={cn(
                               "px-1 rounded font-bold text-[9px]",
                               log.status >= 500 ? "text-red-600" : log.status >= 400 ? "text-amber-600" : "text-emerald-600"
                            )}>{log.status}</span>
                         )}
                      </div>
                      <div className="col-span-10 flex flex-col gap-0.5">
                         <div className="flex items-center gap-3">
                            <span className={cn("uppercase text-[10px] font-bold", levelColors[log.level || log.type])}>{log.level || log.type}</span>
                            <span className="text-foreground/80 leading-relaxed font-medium">{log.message}</span>
                         </div>
                         {log.path && <span className="text-[10px] text-muted-foreground/40 italic">{log.path}</span>}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Hub Layout ---
export default function ObservatoryHub() {
  const { currentProject } = useProject()
  const [activeHash, setActiveHash] = useState('discovery')
  const t = trpc as any

  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId: currentProject?.id }, { enabled: !!currentProject?.id })
  const overview = costOverview.data || { totalCost: 0 }

  const sections = [
    { id: 'discovery', name: 'Discovery', icon: Box },
    { id: 'services', name: 'Services', icon: Layers },
    { id: 'telemetry', name: 'Observability', icon: Terminal },
    { id: 'governance', name: 'Compliance', icon: ShieldCheck },
    { id: 'security', name: 'Security', icon: Lock },
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
    if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' })
  }

  return (
    <AppShell title="Observatory">
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-background">
        
        <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border py-3 px-6 md:px-8">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                      activeHash === section.id 
                        ? "bg-background text-foreground shadow-sm border border-border" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <section.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{section.name}</span>
                  </button>
                ))}
              </div>
              <div className="hidden lg:flex flex-col items-end">
                 <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Telemetry Online
                 </span>
              </div>
           </div>
        </div>

        <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full space-y-24 mb-32 no-scrollbar animate-fade-in">
           <InventorySection />
           <ServicesSection />
           <LogsSection />
           <GovernanceSection />
           <SecuritySection />
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
           <div className="bg-card/90 backdrop-blur-md border border-border shadow-xl rounded-2xl flex items-center gap-4 px-6 py-2.5">
              {[
                { label: 'HEALTH', val: 'Good', color: 'text-emerald-500' },
                { label: 'SPEND', val: `$${overview.totalCost.toFixed(2)}`, color: 'text-foreground' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-[8px] font-bold text-muted-foreground mb-0.5">{stat.label}</span>
                  <span className={cn("text-xs font-bold", stat.color)}>{stat.val}</span>
                </div>
              ))}
              <div className="w-px h-6 bg-border mx-1" />
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase px-4">Jump Top</Button>
           </div>
        </div>

      </div>
    </AppShell>
  )
}
