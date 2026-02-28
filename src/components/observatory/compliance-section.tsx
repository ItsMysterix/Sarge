"use client"

import { Coins, TrendingDown, AlertTriangle, CheckCircle2, ArrowDown, ShieldCheck, DollarSign, Activity, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { GridLoader } from "@/components/ui/grid-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export const ComplianceSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const costQ = t.costOptimization.getCostOverview.useQuery({ projectId }, { enabled: !!projectId })
  const recsQ = t.costOptimization.getRecommendations.useQuery({ projectId }, { enabled: !!projectId })
  const budgetQ = t.costOptimization.getBudgetStatus.useQuery({ projectId }, { enabled: !!projectId })

  const overview = costQ.data || { totalCost: 0, breakdown: [] }
  const recommendations = recsQ.data?.recommendations || []
  const budget = budgetQ?.data
  const isLoading = costQ.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const severityColor: Record<string, string> = {
    high: 'text-red-400 border-red-500/10 bg-red-500/5',
    medium: 'text-amber-400 border-amber-500/10 bg-amber-500/5',
    low: 'text-white/20 border-white/5 bg-white/5',
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* FinOps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Monthly Expenditure</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight tabular-nums">${overview.totalCost.toFixed(2)}</span>
            <span className="text-xs font-bold text-white/10 uppercase tracking-widest">USD</span>
          </div>
          <div className="flex items-center gap-2 mt-6 text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Live Sync
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Savings Potential</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400/80 tracking-tight tabular-nums">${(recsQ.data?.totalPotentialSavings || 0).toFixed(2)}</span>
          </div>
          <p className="text-[10px] font-bold text-white/10 mt-6 uppercase tracking-widest">{recommendations.length} Active Suggestions</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Budget Compliance</p>
          <div className="flex items-baseline gap-3">
             <span className={cn("text-3xl font-bold uppercase tracking-tight",
              budget?.overBudget ? "text-red-400/80" : "text-white/60"
            )}>
              {budget ? (budget.overBudget ? 'Exceeded' : 'Healthy') : 'N/A'}
            </span>
          </div>
          {budget?.percentage != null && (
            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <div 
                className={cn("h-full transition-all duration-1000", budget.overBudget ? 'bg-red-500' : 'bg-white/20')} 
                style={{ width: `${Math.min(budget.percentage, 100)}%` }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
              <TrendingDown className="w-4 h-4 text-white/40" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Optimization Feed</h3>
              <p className="text-xs text-white/20 mt-0.5">Automated suggestions to reduce your cloud bill.</p>
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-white/10 transition-all shadow-lg"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border transition-all", severityColor[rec.severity] || severityColor.low)}>
                    {rec.severity === 'high' ? <AlertTriangle className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <p className="text-sm font-bold text-white/80 transition-colors uppercase truncate">{rec.recommendation || rec.type}</p>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-white/5 border-white/10 text-white/20">
                        {rec.type?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">
                       {rec.resource} · Current: ${Number(rec.currentCost || 0).toFixed(2)}/mo
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl px-5 py-2.5">
                  <p className="text-sm font-bold text-emerald-400">-${Number(rec.estimatedSavings || 0).toFixed(2)}</p>
                  <p className="text-[8px] font-bold text-emerald-500/20 uppercase tracking-widest mt-1">Est. Savings</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Enforcement Policies */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
             <Settings2 className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Budget Policies</h3>
            <p className="text-xs text-white/20 mt-0.5">Define limits and automated responses for overspending.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white/80 mb-1 uppercase tracking-widest">Monthly Limit</h3>
            <p className="text-[10px] text-white/10 mb-6 uppercase tracking-widest italic">Set a notification and enforcement threshold.</p>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  defaultValue={150}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm font-bold font-mono focus:outline-none focus:border-white/20 transition-all text-white/60" 
                />
              </div>
              <Button className="h-11 px-6 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
                 Save Limit
              </Button>
            </div>
          </div>

          <div className="bg-black border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white/80 mb-1 uppercase tracking-widest">Auto-Enforcement</h3>
            <p className="text-[10px] text-white/10 mb-6 uppercase tracking-widest italic">Action to take when limit is exceeded.</p>
            <div className="relative">
              <select className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all text-white/40 appearance-none cursor-pointer">
                <option value="alert" className="bg-black">Notify Project Leads</option>
                <option value="suspend_previews" className="bg-black">Pause Preview Environments</option>
                <option value="suspend_non_prod" className="bg-black">Pause All Non-Production Environments</option>
                <option value="hard_stop" disabled className="bg-black">Complete Suspension (Admin only)</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                 <ArrowDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
