"use client"

import { Coins, TrendingDown, AlertTriangle, CheckCircle2, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { GridLoader } from "@/components/ui/grid-loader"
import { Badge } from "@/components/ui/badge"
import { Card, EmptyState, SectionHeader } from "./shared"

export const ComplianceSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const costQ = t.costOptimization.getCostOverview.useQuery({ projectId }, { enabled: !!projectId })
  const recsQ = t.costOptimization.getRecommendations.useQuery({ projectId }, { enabled: !!projectId })
  const budgetQ = t.costOptimization.getBudgetStatus?.useQuery?.({ projectId }, { enabled: !!projectId })

  const overview = costQ.data || { totalCost: 0, breakdown: [] }
  const recommendations = recsQ.data?.recommendations || []
  const budget = budgetQ?.data

  const loading = costQ.isLoading

  if (loading) return <div className="flex justify-center py-20"><GridLoader /></div>

  const severityColor: Record<string, string> = {
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center py-8">
          <Coins className="w-6 h-6 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Monthly Spend</p>
          <p className="text-3xl font-bold tracking-tight">${overview.totalCost.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{overview.currency || 'USD'}</p>
        </Card>

        <Card className="text-center py-8">
          <TrendingDown className="w-6 h-6 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Potential Savings</p>
          <p className="text-3xl font-bold tracking-tight text-emerald-400">
            ${(recsQ.data?.totalPotentialSavings || 0).toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{recommendations.length} optimizations found</p>
        </Card>

        <Card className="text-center py-8">
          <CheckCircle2 className={cn("w-6 h-6 mx-auto mb-3",
            budget?.overBudget ? "text-red-400/30" : "text-emerald-400/30"
          )} />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Budget Status</p>
          <p className={cn("text-3xl font-bold tracking-tight uppercase",
            budget?.overBudget ? "text-red-400" : "text-emerald-400"
          )}>
            {budget ? (budget.overBudget ? 'Over' : 'Under') : 'OK'}
          </p>
          {budget?.percentage != null && (
            <p className="text-[10px] text-muted-foreground mt-1">{budget.percentage.toFixed(0)}% of budget used</p>
          )}
        </Card>
      </div>

      {/* Cost Breakdown by Provider */}
      {overview.breakdown?.length > 0 && (
        <div>
          <SectionHeader title="Cost by Provider" icon={Coins} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.breakdown.map((item: any, i: number) => (
              <Card key={i} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.provider || item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Object.entries(item.breakdown || {}).map(([k, v]) => `${k}: $${Number(v).toFixed(2)}`).join(' · ')}
                  </p>
                </div>
                <p className="text-sm font-bold font-mono">${Number(item.cost || item.total || 0).toFixed(2)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cost Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <SectionHeader title="Optimization Recommendations" icon={TrendingDown} />
          <div className="space-y-3">
            {recommendations.map((rec: any, i: number) => (
              <Card key={i} className="flex items-start gap-4 py-4">
                <div className={cn("shrink-0 p-2 rounded-lg border", severityColor[rec.severity] || severityColor.low)}>
                  {rec.severity === 'high' ? <AlertTriangle className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold">{rec.recommendation || rec.type}</p>
                    <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest">{rec.type?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.resource} — Current cost: ${Number(rec.currentCost || 0).toFixed(2)}/mo</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-400">-${Number(rec.estimatedSavings || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">/month</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && overview.totalCost === 0 && (
        <EmptyState icon={Coins} title="No cost data yet." subtitle="Connect cloud providers and deploy services to see cost analytics and optimization recommendations." />
      )}
    </div>
  )
}
