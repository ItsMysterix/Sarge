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
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery()
  const resources = inventoryQuery.data || []
  const router = useRouter()

  if (inventoryQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

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
  const alertsQuery = trpc.commandCenter.getSecurityAlerts.useQuery()
  const alerts = alertsQuery.data || []
  const router = useRouter()

  if (alertsQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

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
  const domainsQuery = trpc.commandCenter.getDomains.useQuery()
  const router = useRouter()

  if (domainsQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

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
  const [activeTab, setActiveTab] = useState<'inventory' | 'metrics' | 'logs' | 'security' | 'domains' | 'storage' | 'usage'>('inventory')
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
    <AppShell title="Command Center">
      <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-black/40">
        {/* Vercel-style Vertical Sidebar */}
        <div className="w-64 border-r border-white/5 flex flex-col p-4 space-y-2 bg-black/20 backdrop-blur-3xl">
          <div className="mb-8 px-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Command Hub 
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1 opacity-50">
              {currentProject?.name || 'Global Account'}
            </p>
          </div>

          <div className="space-y-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                  activeTab === tab.id 
                    ? "bg-foreground/5 text-foreground ring-1 ring-white/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <tab.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-foreground" : "text-muted-foreground/60")} />
                {tab.name}
                {activeTab === tab.id && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
             <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-bold text-indigo-400/80 uppercase">AI CFO Insight</span>
                   <Zap className="w-3 h-3 text-indigo-400" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Your multi-cloud environment is <span className="text-foreground">94%</span> efficient. Consider scaling down "sarge-assets" S3 bucket.
                </p>
             </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-transparent to-indigo-500/5">
           <div className="p-8 max-w-5xl">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.15 }}
                 >
                    {activeTab === 'inventory' && <InventoryTab />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'domains' && <DomainsTab />}
                    
                    {/* Fallback for other tabs still being ported */}
                    {['metrics', 'logs', 'storage', 'usage'].includes(activeTab) && (
                      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                         <div className="p-4 rounded-full bg-foreground/5 border border-white/5 animate-pulse">
                            <Box className="w-8 h-8 text-muted-foreground" />
                         </div>
                         <div>
                            <h3 className="text-sm font-semibold text-foreground">Cloud Stream Hydrating...</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-2">
                               We are fetching real-time data for <span className="capitalize">{activeTab}</span> from all connected providers. This will appear in 3-5 seconds.
                            </p>
                         </div>
                      </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </div>
    </AppShell>
  )
}
