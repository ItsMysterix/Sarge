"use client"

import { motion } from "framer-motion"
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, DollarSign, ArrowRight, Zap } from "lucide-react"
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
      className="space-y-12 pb-20"
    >
      {/* FinOps Ledger Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 flex items-center gap-8">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
             <CreditCard className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-foreground">FinOps Ledger & Spend Nexus</h3>
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
              Consolidated cloud economics orchestrator. Sarge ingest telemetry from linked identities to provide zero-trust spend visibility & resource hardening protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'EST_MONTHLY_EXPENDITURE', val: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: '+2.4%_CYCLICAL_DELTA', delta: true, icon: DollarSign },
          { label: 'QUOTA_EFFICIENCY', val: budgetStatus?.percentUsed ? `${Math.round(budgetStatus.percentUsed)}%` : '0%', sub: `LIMIT: $${budgetStatus?.budget || 0} / TIER_1`, icon: AlertCircle },
          { label: 'OPTIMIZATION_YIELD', val: `$${recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0).toFixed(2)}`, sub: `${recommendations.length} HARDENING_NODES`, highlight: true, icon: CheckCircle2 }
        ].map((stat) => (
          <div key={stat.label} className={cn(
            "bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-xl group hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01]",
            stat.highlight && "border-emerald-500/5 hover:border-emerald-500/20"
          )}>
            <div className="flex items-center gap-3 text-muted-foreground/20 text-[9px] font-black uppercase tracking-[0.3em] mb-6">
               <stat.icon className={cn("w-4 h-4", stat.highlight ? "text-emerald-500/40" : "text-muted-foreground/10")} /> {stat.label}
            </div>
            <div className={cn("text-4xl font-black tracking-tighter mb-6", stat.highlight ? "text-emerald-400" : "text-foreground/90")}>
              {stat.val}
            </div>
            <div className="flex items-center gap-3">
              {stat.delta && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              <span className={cn("text-[9px] font-black uppercase tracking-widest", stat.highlight ? "text-emerald-400/40" : "text-muted-foreground/30 font-bold")}>
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Spend Matrix */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 ring-1 ring-inset ring-white/[0.01]">
        <div className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="flex flex-col gap-2">
            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Resource Spend Matrix</h3>
            <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">Cross-account cloud identifier telemetry</p>
          </div>
          <Badge variant="outline" className="h-8 flex items-center gap-3 px-5 border-white/5 bg-[#050505] rounded-xl text-muted-foreground/40 font-black tracking-[0.2em] text-[9px]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            LIVE_TELEMETRY: {costOverview?.updatedAt ? new Date(costOverview.updatedAt).toLocaleTimeString().toUpperCase() : 'QUEUED'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Lifecycle Actuals */}
          <div className="space-y-10 text-emerald-400/40">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Lifecycle Actuals (Verified)
            </div>
            {costOverview?.breakdown?.filter((item: any) => item.is_actual).length > 0 ? (
              <div className="space-y-12">
                {costOverview.breakdown.filter((item: any) => item.is_actual).map((item: any, i: number) => (
                  <div key={i} className="space-y-6 group/item">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground/80">{item.provider}</span>
                        <div className="px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[8px] font-black tracking-widest">REAL_TIME</div>
                      </div>
                      <div className="text-right text-[12px] font-black font-mono text-emerald-400">${parseFloat(item.total_cost).toFixed(2)}</div>
                    </div>
                    <div className="h-2 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5 ring-1 ring-inset ring-white/[0.01]">
                      <div 
                        className="h-full bg-emerald-500/40 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover/item:bg-emerald-500/60" 
                        style={{ width: `${Math.min((item.total_cost / (costOverview.totalCost || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-10 pt-4">
                      {item.breakdown && Object.entries(item.breakdown).map(([service, amount]: [string, any]) => (
                        <div key={service} className="space-y-1.5">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 block">{service}</span>
                          <span className="text-[11px] font-black font-mono text-foreground/40 block">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10">Zero Active Telemetry Nodes Detected</p>
              </div>
            )}
          </div>

          {/* Deployment Forecast */}
          <div className="space-y-10 text-amber-400/40 opacity-40 hover:opacity-100 transition-opacity duration-1000">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Deployment Forecast (Estimated)
            </div>
            {costOverview?.breakdown?.filter((item: any) => !item.is_actual).length > 0 ? (
              <div className="space-y-12">
                {costOverview.breakdown.filter((item: any) => !item.is_actual).map((item: any, i: number) => (
                  <div key={i} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground/40">{item.provider}</span>
                        <div className="px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[8px] font-black tracking-widest opacity-40">MOCK_PLAN</div>
                      </div>
                      <div className="text-right text-[12px] font-black font-mono text-amber-400/60">${parseFloat(item.total_cost).toFixed(2)}</div>
                    </div>
                    <div className="h-2 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-amber-400/20 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(251,191,36,0.1)]" 
                        style={{ width: `${Math.min((item.total_cost / (costOverview.totalCost || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10">Reference Forecast Inactive</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hardening Protocols */}
      {recommendations.length > 0 && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-1000延迟-500">
          <div className="flex items-center gap-6 border-b border-white/5 pb-8">
             <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <Zap className="w-5 h-5 text-amber-400" />
             </div>
             <div className="flex flex-col">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Efficiency & Hardening Protocols</h3>
               <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Automated cost mitigation & resource right-sizing strategies</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between group hover:border-white/10 transition-all duration-700 shadow-xl overflow-hidden relative ring-1 ring-inset ring-white/[0.01]">
                <div className="absolute top-0 right-0 p-8">
                   <span className="text-[12px] font-black font-mono text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)] uppercase tracking-tighter">DELTA: -${rec.estimatedSavings}</span>
                </div>
                <div className="space-y-6">
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase px-3 py-1 rounded-lg border tracking-[0.2em] h-6",
                    rec.severity === 'high' ? "bg-red-500/5 text-red-400/60 border-red-500/10" : "bg-amber-500/5 text-amber-400/60 border-amber-500/10"
                  )}>
                    {rec.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="space-y-3">
                    <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground/80 group-hover:text-foreground transition-colors">{rec.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-[0.25em] leading-relaxed group-hover:text-muted-foreground/40 transition-colors">{rec.description}</p>
                  </div>
                </div>
                <Button className="mt-10 w-full h-12 bg-[#050505] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-foreground/40 hover:text-foreground/80 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 flex items-center justify-center gap-4">
                   EXECUTE_PROTOCOL <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

