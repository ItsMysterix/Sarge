"use client"

import { motion } from "framer-motion"
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, DollarSign, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BillingTabProps {
  costOverview: any
  recommendations: any[]
  budgetStatus: any
}

export function BillingTab({ costOverview, recommendations, budgetStatus }: BillingTabProps) {
  const totalCost = costOverview?.totalCost || 0
  const currency = costOverview?.currency || 'USD'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Sarge Bridge Header */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5" /> Cloud Management Bridge
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Sarge is your orchestration layer. We help you choose the best provider for your stack and optimize costs.
            <strong> Note:</strong> Bills are paid directly to your cloud providers (AWS, Vercel, etc.).
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
             <DollarSign className="w-3.5 h-3.5" /> Est. Monthly Spend
          </div>
          <div className="text-3xl font-bold text-foreground">
            ${totalCost.toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> +2.4% from last month
          </div>
        </div>

        <div className="glass-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
             <AlertCircle className="w-3.5 h-3.5" /> Budget Efficiency
          </div>
          <div className="text-3xl font-bold text-foreground">
            {budgetStatus?.percentUsed ? `${Math.round(budgetStatus.percentUsed)}%` : '--'}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Limit: ${budgetStatus?.budget || 0}/mo
          </div>
        </div>

        <div className="glass-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
             <CheckCircle2 className="w-3.5 h-3.5" /> Potential Savings
          </div>
          <div className="text-3xl font-bold text-emerald-500">
            ${recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0).toFixed(2)}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Across {recommendations.length} optimizations
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
        <div className="glass-card border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center justify-between">
            Spend by Provider
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-tighter">Live Sync: {costOverview?.updatedAt ? new Date(costOverview.updatedAt).toLocaleTimeString() : 'Pending'}</span>
            </div>
          </h3>
          
          <div className="space-y-8">
            {/* Live Spend Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> Infrastructure Bridge (Live Spend)
              </h4>
              {costOverview?.breakdown?.filter((item: any) => item.is_actual).length > 0 ? (
                costOverview.breakdown.filter((item: any) => item.is_actual).map((item: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-foreground">{item.provider}</span>
                        <span className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-tighter">
                          ACTUAL BILL
                        </span>
                      </div>
                      <div className="text-right text-xs font-mono font-bold">${parseFloat(item.total_cost).toFixed(2)}</div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500/50 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((item.total_cost / (costOverview.totalCost || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {item.breakdown && Object.entries(item.breakdown).map(([service, amount]: [string, any]) => (
                        <div key={service} className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <span className="opacity-50">{service}:</span>
                          <span className="font-mono text-foreground/80">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-muted-foreground italic pl-3 border-l border-white/5">No active production bills found.</div>
              )}
            </div>

            {/* Planning Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500" /> Planning Bench (Forecasting)
              </h4>
              {costOverview?.breakdown?.filter((item: any) => !item.is_actual).length > 0 ? (
                costOverview.breakdown.filter((item: any) => !item.is_actual).map((item: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-foreground">{item.provider}</span>
                        <span className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-tighter">
                          ESTIMATE
                        </span>
                      </div>
                      <div className="text-right text-xs font-mono font-bold">${parseFloat(item.total_cost).toFixed(2)}</div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500/30 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((item.total_cost / (costOverview.totalCost || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-muted-foreground italic pl-3 border-l border-white/5">No pre-deployment estimates in this project.</div>
              )}
            </div>
          </div>
        </div>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Smart Optimizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="glass-card border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-white/20 transition-all">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border",
                      rec.severity === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {rec.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-500">Save ${rec.estimatedSavings}</span>
                  </div>
                  <h4 className="text-xs font-semibold mb-1">{rec.title}</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">{rec.description}</p>
                </div>
                <button className="w-full py-2 bg-muted/50 hover:bg-muted text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                  Apply Optimization <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

import { Zap } from "lucide-react"
