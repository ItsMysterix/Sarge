"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
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
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { GridLoader } from "@/components/ui/grid-loader"
import { useProject } from "@/lib/project-context"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  if (inventoryQuery.isLoading) return <div className="flex items-center justify-center min-h-[400px]"><GridLoader /></div>

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

// --- Security Tab ---
const SecurityTab = () => {
  const { currentProject } = useProject()
  const alertsQuery = trpc.commandCenter.getSecurityAlerts.useQuery({ projectSlug: currentProject?.slug })
  const alerts = alertsQuery.data || []

  if (alertsQuery.isLoading) return <div className="flex items-center justify-center min-h-[400px]"><GridLoader /></div>

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

  if (domainsQuery.isLoading) return <div className="flex items-center justify-center min-h-[400px]"><GridLoader /></div>

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
export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('inventory')
  const { currentProject } = useProject()

  const tabs = [
    { id: 'inventory', name: 'Overview', icon: Box },
    { id: 'metrics', name: 'Analytics', icon: BarChart3 },
    { id: 'logs', name: 'Logs', icon: Terminal },
    { id: 'security', name: 'Security', icon: ShieldCheck },
    { id: 'domains', name: 'Domains', icon: Globe },
    { id: 'storage', name: 'Storage', icon: Database },
    { id: 'usage', name: 'Usage', icon: Zap },
  ]

  return (
    <AppShell title="Observability Hub">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full animate-fade-in">
        
        {/* Actions Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground">Observability Hub</h1>
               <p className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-widest opacity-70">
                 {currentProject?.name ? `Global insights for ${currentProject.name}` : 'Multi-cloud resource intelligence'}
               </p>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" className="h-9 border-white/10 bg-white/5 rounded-xl font-bold text-[10px] uppercase tracking-wider">
                  <Plus className="w-4 h-4 mr-2" /> Custom Widget
               </Button>
               <Button className="h-9 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-[10px] tracking-wide rounded-xl">
                  <Zap className="w-4 h-4 mr-2" /> Global Audit
               </Button>
            </div>
        </div>

        <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-muted/10 w-full justify-start border border-border/50 rounded-xl p-1 mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg",
                  "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="focus:outline-none"
            >
              <TabsContent value="inventory" className="mt-0 focus-visible:outline-none">
                <InventoryTab />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                <SecurityTab />
              </TabsContent>
              
              <TabsContent value="domains" className="mt-0 focus-visible:outline-none">
                <DomainsTab />
              </TabsContent>
              
              {['metrics', 'logs', 'storage', 'usage'].map(tabId => (
                <TabsContent key={tabId} value={tabId} className="mt-0 focus-visible:outline-none">
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 glass-card border border-white/5 rounded-3xl p-12">
                     <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-pulse text-indigo-400">
                        <Layers className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Hydrating Cloud Stream...</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-2 leading-relaxed">
                           We are establishing safe telemetry channels to your providers. 
                           Real-time <span className="text-foreground font-bold capitalize">{tabId}</span> data will be synchronized shortly.
                        </p>
                     </div>
                     <Button variant="outline" className="mt-4 border-white/10 rounded-full h-9 text-[10px] font-bold uppercase tracking-widest">
                        Refresh Connection
                     </Button>
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
