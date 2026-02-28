"use client"

import { motion } from "framer-motion"
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, DollarSign, ArrowRight, Zap, PieChart, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BillingTabProps {
  costOverview: any
  recommendations: any[]
  budgetStatus: any
}

export function BillingTab({ costOverview, recommendations, budgetStatus }: BillingTabProps) {
  const totalCost = costOverview?.totalCost || 0
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 animate-in fade-in duration-700"
    >
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
             <CreditCard className="w-6 h-6 text-white/40" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Billing & Cost Management</h3>
            <p className="text-xs text-white/20 mt-0.5 max-w-2xl leading-relaxed uppercase font-bold tracking-widest">
              Consolidated financial monitoring across all connected cloud providers and infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Estimated Bill', val: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Projected Monthly Expenditure', icon: DollarSign },
          { label: 'Budget Usage', val: budgetStatus?.percentUsed ? `${Math.round(budgetStatus.percentUsed)}%` : '0%', sub: `Threshold: $${budgetStatus?.budget || 0}`, icon: Activity },
          { label: 'Potential Savings', val: `$${recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0).toFixed(2)}`, sub: `${recommendations.length} Active Suggestions`, highlight: true, icon: TrendingUp }
        ].map((stat) => (
          <div key={stat.label} className={cn(
            "bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl group hover:border-white/10 transition-all",
            stat.highlight && "border-white/10"
          )}>
            <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest mb-6">
               <stat.icon className="w-3.5 h-3.5" /> {stat.label}
            </div>
            <div className={cn("text-3xl font-bold tracking-tight mb-6", stat.highlight ? "text-emerald-400" : "text-white/80")}>
              {stat.val}
            </div>
            <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Resource Breakdown */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <PieChart className="w-4 h-4 text-white/40" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Cost Breakdown</h3>
          </div>
          <Badge variant="outline" className="h-6 flex items-center gap-2 px-3 border-white/5 bg-black text-white/20 font-bold tracking-widest text-[8px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg" />
            Updated {costOverview?.updatedAt ? new Date(costOverview.updatedAt).toLocaleTimeString() : 'Recently'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Active Spend */}
          <div className="space-y-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Active Provider Spend
            </div>
            {costOverview?.breakdown?.length > 0 ? (
              <div className="space-y-10">
                {costOverview.breakdown.map((item: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80">{item.provider}</span>
                        {item.is_actual && (
                          <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 bg-emerald-500/5 text-emerald-400/40 border-emerald-500/10 tracking-widest uppercase">Verified</Badge>
                        )}
                      </div>
                      <div className="text-xs font-bold font-mono text-white/60">${parseFloat(item.total_cost).toFixed(2)}</div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/20 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((item.total_cost / (costOverview.totalCost || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {item.breakdown && Object.entries(item.breakdown).map(([service, amount]: [string, any]) => (
                        <div key={service} className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-white/10 block truncate">{service}</span>
                          <span className="text-xs font-bold font-mono text-white/40 block">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-white/5">No cost data available</p>
              </div>
            )}
          </div>

          <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-2xl p-8 relative flex flex-col items-center justify-center">
             <TrendingUp className="w-12 h-12 text-white/5 mb-6" />
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest text-center max-w-xs leading-relaxed italic">
               Visualizing predictive spend models and historical budget variances to ensure infrastructure compliance.
             </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                <Zap className="w-4 h-4 text-white/40" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-white uppercase tracking-tight">Optimization Opportunities</h3>
               <p className="text-xs text-white/20 mt-0.5">Automated suggestions to reduce unnecessary expenditures.</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-white/10 transition-all shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                   <span className="text-xs font-bold font-mono text-emerald-400">-${rec.estimatedSavings}</span>
                </div>
                <div className="space-y-4">
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-bold uppercase px-2 py-0.5 rounded-lg border tracking-widest",
                    rec.severity === 'high' ? "bg-red-500/5 text-red-500/40 border-red-500/10" : "bg-white/5 text-white/20 border-white/10"
                  )}>
                    {rec.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{rec.title}</h4>
                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest leading-relaxed group-hover:text-white/40 transition-colors line-clamp-2">{rec.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-8 w-full h-10 bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] text-white/40 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                   Apply Suggestion <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
