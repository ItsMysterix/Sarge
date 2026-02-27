"use client"

import { Coins, TrendingDown, AlertTriangle, CheckCircle2, ArrowDown, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { GridLoader } from "@/components/ui/grid-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, EmptyState, SectionHeader } from "./shared"

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
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const severityColor: Record<string, string> = {
    high: 'text-red-400 border-red-500/20 bg-red-500/5',
    medium: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    low: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* FinOps Overview Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Coins className="w-16 h-16" />
          </div>
          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Projected Monthly Burn</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground/90 tabular-nums">${overview.totalCost.toFixed(2)}</span>
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{overview.currency || 'USD'}</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" />
            Live reconciliation
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <TrendingDown className="w-16 h-16" />
          </div>
          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Total Optimization Yield</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 tabular-nums">${(recsQ.data?.totalPotentialSavings || 0).toFixed(2)}</span>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground/40 mt-4 uppercase tracking-widest">{recommendations.length} active opportunities</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
             <ShieldCheck className="w-16 h-16" />
          </div>
          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Budget Hardstop Status</p>
          <div className="flex items-baseline gap-3">
             <span className={cn("text-3xl font-black uppercase tracking-tight",
              budget?.overBudget ? "text-red-400" : "text-indigo-400"
            )}>
              {budget ? (budget.overBudget ? 'Exceeded' : 'Compliant') : 'Nominal'}
            </span>
          </div>
          {budget?.percentage != null && (
            <div className="mt-4 w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
               <div 
                className={cn("h-full transition-all duration-1000", budget.overBudget ? 'bg-red-500' : 'bg-indigo-500')} 
                style={{ width: `${Math.min(budget.percentage, 100)}%` }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Optimization Recommendations Feed */}
      {recommendations.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <TrendingDown className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Efficiency Protocol Yields</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec: any, i: number) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-6 hover:border-white/10 transition-all shadow-sm group">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", severityColor[rec.severity] || severityColor.low)}>
                  {rec.severity === 'high' ? <AlertTriangle className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-black text-foreground/90 tracking-tight truncate">{rec.recommendation || rec.type}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white/5 border-white/10 opacity-60">
                      {rec.type?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                     Resource: <span className="text-foreground/40">{rec.resource}</span> · Current Burn: ${Number(rec.currentCost || 0).toFixed(2)}/mo
                  </p>
                </div>
                <div className="text-right shrink-0 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-2 hover:bg-emerald-500/10 transition-colors">
                  <p className="text-sm font-black text-emerald-400">-${Number(rec.estimatedSavings || 0).toFixed(2)}</p>
                  <p className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Est. Savings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enforcement Policies */}
      <div className="space-y-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Budget Guardrails</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#080808] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-foreground/90 mb-1 uppercase tracking-tight">Capacitance Limit</h3>
            <p className="text-[10px] font-bold text-muted-foreground/40 mb-6 uppercase tracking-widest">Define mandatory billing hard-stop in localized currency.</p>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-sm">$</span>
                <input 
                  type="number" 
                  defaultValue={150}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm font-black font-mono focus:outline-none focus:border-indigo-500/50 transition-all text-foreground/80" 
                />
              </div>
              <Button className="h-11 px-6 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:opacity-90">
                 Bind Guard
              </Button>
            </div>
          </div>

          <div className="bg-[#080808] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-foreground/90 mb-1 uppercase tracking-tight">Escalation Protocol</h3>
            <p className="text-[10px] font-bold text-muted-foreground/40 mb-6 uppercase tracking-widest">Automated response when consumption hits 110% of defined limit.</p>
            <div className="relative">
              <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500/50 transition-all text-foreground/70 appearance-none cursor-pointer">
                <option value="alert">Silent Signal (Notify Node)</option>
                <option value="suspend_previews">Suspend Transient Previews</option>
                <option value="suspend_non_prod">Shutdown Non-Prod Clusters</option>
                <option value="hard_stop" disabled>Full System Blackout (L3 Only)</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                 <ArrowDown className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
