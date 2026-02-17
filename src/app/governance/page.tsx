"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Shield, 
  Coins, 
  GitCompare, 
  Lock, 
  ChevronRight, 
  Eye, 
  Clock, 
  User, 
  FileJson,
  Moon,
  Sun,
  Zap,
  TrendingDown,
  PieChart,
  Wallet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Play
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { format } from "date-fns"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/project-context"

// Sub-components for each tab to keep the file manageable
const AuditTab = ({ projectId, t }: any) => {
  const [limit] = useState(20)
  const [cursor, setCursor] = useState<string | undefined>()
  const [userIdFilter, setUserIdFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const auditQuery = t.auditLogs.list.useQuery({
    userId: userIdFilter || undefined,
    action: actionFilter || undefined,
    limit,
    cursor,
  }, { keepPreviousData: true })

  const filtersQuery = t.auditLogs.getFilters.useQuery()
  const logs = auditQuery.data?.items || []
  const nextCursor = auditQuery.data?.nextCursor
  const filterOptions = filtersQuery.data || { resourceTypes: [], actions: [] }

  const getActionIcon = (action: string) => {
    if (action.includes('secret')) return <Lock className="w-4 h-4 text-amber-400" />
    if (action.includes('delete') || action.includes('remove')) return <Shield className="w-4 h-4 text-red-500" />
    if (action.includes('create') || action.includes('add')) return <Shield className="w-4 h-4 text-emerald-500" />
    return <Activity className="w-4 h-4 text-blue-400" />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <select
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs appearance-none focus:outline-none"
          >
            <option value="">All Users</option>
            <option value="system">System</option>
          </select>
          <button 
             onClick={() => { setCursor(undefined); setActionFilter(""); setUserIdFilter("") }}
             className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px]">Action</th>
                <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px]">User</th>
                <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px]">Time</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.map((log: any) => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className={cn("group hover:bg-white/5 cursor-pointer", selectedLog?.id === log.id && "bg-white/10")}
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    <span className="truncate max-w-[120px]">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[100px]">{log.userId}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "HH:mm:ss")}
                  </td>
                  <td className="px-4 py-3"><Eye className="w-3 h-3 group-hover:text-emerald-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-1">
        {selectedLog ? (
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Event Detail
            </h3>
            <div className="space-y-3 mb-4 text-[11px]">
              <div><span className="text-muted-foreground block mb-0.5">TIMELINE</span> {new Date(selectedLog.createdAt).toLocaleString()}</div>
              <div><span className="text-muted-foreground block mb-0.5">ACTOR</span> {selectedLog.userId}</div>
            </div>
            <div className="bg-black/40 rounded-lg p-3 border border-white/10 overflow-auto max-h-[200px]">
              <pre className="text-[10px] text-emerald-300/80">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="glass-card p-10 text-center border-dashed border border-white/10">
            <Lock className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Select a log</p>
          </div>
        )}
      </div>
    </div>
  )
}

const CostTab = ({ projectId, t, addToast }: any) => {
  const costOverview = t.costOptimization.getCostOverview.useQuery({ projectId })
  const recommendations = t.costOptimization.getRecommendations.useQuery({ projectId })
  const budgetStatus = t.costOptimization.getBudgetStatus.useQuery({ projectId })
  const environmentsQuery = t.environments.list.useQuery({ projectId })

  const detectIdle = t.costOptimization.detectIdleEnvironments.useMutation({
    onSuccess: () => {
      addToast({ type: "success", title: "Idle Scan Complete", description: "Environments updated." })
      environmentsQuery.refetch()
    }
  })

  const overview = costOverview.data || { totalCost: 0, breakdown: [] }
  const recs = recommendations.data?.recommendations || []
  const environments = environmentsQuery.data || []
  const nonProdEnvs = environments.filter((e: any) => e.type !== 'production')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 glass-card">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total Spend</p>
          <p className="text-2xl font-bold">${overview.totalCost.toFixed(2)}</p>
        </div>
        <div className="p-4 glass-card border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Savings Potential</p>
          <p className="text-2xl font-bold text-emerald-400">${recommendations.data?.totalPotentialSavings.toFixed(2) || "0.00"}</p>
        </div>
        <div className="p-4 glass-card flex items-center justify-center">
           <button 
              onClick={() => detectIdle.mutate({ projectId })}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
           >
             <Moon className="w-4 h-4" /> Run Idle Scan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card h-fit">
          <div className="p-4 border-b border-white/10 font-semibold text-sm">Sleep Mode Status</div>
          <div className="divide-y divide-white/5">
            {nonProdEnvs.map((env: any) => (
              <div key={env.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {env.status === 'idle' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <div>
                    <h4 className="text-sm font-medium">{env.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{env.status === 'idle' ? 'Sleeping' : 'Active'}</p>
                  </div>
                </div>
                {env.status === 'idle' && (
                  <button className="text-[10px] font-bold px-3 py-1 bg-white text-black rounded-lg">WAKE UP</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 h-fit">
           <p className="text-sm font-semibold mb-4">Recommendations</p>
           <div className="space-y-3">
             {recs.slice(0, 3).map((rec: any, i: number) => (
               <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                 <div className="flex justify-between mb-1">
                   <p className="text-[10px] font-bold text-emerald-400">-${rec.estimatedSavings}</p>
                   <p className="text-[9px] text-muted-foreground uppercase">{rec.type}</p>
                 </div>
                 <p className="text-xs font-medium">{rec.title}</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

const DriftTab = ({ projectId, t, addToast }: any) => {
  const deploymentsQuery = t.kubernetes.listDeployments.useQuery({ clusterId: 'global' })
  const driftMutation = t.kubernetes.detectDrift.useMutation()
  const redeployMutation = t.kubernetes.redeploy.useMutation()

  const deployments = deploymentsQuery.data || []
  
  const handleDriftCheck = (id: string) => {
    driftMutation.mutate({ deploymentId: id }, {
      onSuccess: () => {
        addToast({ type: "success", title: "Drift Check Complete", description: "System has been reconciled." })
        deploymentsQuery.refetch()
      }
    })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {deployments.map((dep: any) => (
              <tr key={dep.id} className="group hover:bg-white/[0.02]">
                <td className="px-4 py-4 pr-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white/90">{dep.name}</span>
                    <span className="text-[10px] text-muted-foreground">{dep.namespace}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border",
                    dep.status === 'synchronized' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    dep.status === 'drifted' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                  )}>
                    {dep.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {dep.image}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                       onClick={() => handleDriftCheck(dep.id)}
                       className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", driftMutation.isLoading && "animate-spin")} />
                    </button>
                    {dep.status === 'drifted' && (
                       <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold">
                         <Play className="w-3 h-3 fill-current" /> FIX
                       </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'cost' | 'drift'>('cost')
  const { currentProject } = useProject()
  const projectId = currentProject?.id || ""
  const { addToast, ToastContainer } = useToast()
  const t = trpc as any

  const tabs = [
    { id: 'cost', name: 'Cost Analytics', icon: Coins },
    { id: 'drift', name: 'GitOps Drift', icon: GitCompare },
    { id: 'audit', name: 'Audit Trail', icon: Shield },
  ]

  return (
    <AppShell title="Governance Center">
      <ToastContainer />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'cost' && <CostTab projectId={projectId} t={t} addToast={addToast} />}
          {activeTab === 'drift' && <DriftTab projectId={projectId} t={t} addToast={addToast} />}
          {activeTab === 'audit' && <AuditTab projectId={projectId} t={t} />}
        </div>
      </div>
    </AppShell>
  )
}


// Internal Activity sub-component fix
const Activity = ({ className }: { className: string }) => <RefreshCw className={className} />;
