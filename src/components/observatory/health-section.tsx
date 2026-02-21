"use client"

import { HeartPulse, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState, SectionHeader } from "./shared"
import { formatDistanceToNow } from "date-fns"

export const HealthSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any

  // Get all deployments to find health checks
  const deploysQ = t.deploy.getDeployments.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (last: any) => last.nextCursor }
  )
  const deployments = deploysQ.data?.pages?.flatMap((p: any) => p.items) || []

  // For each active deployment, try to get health checks
  const firstDeployId = deployments[0]?.id || ''
  const healthQ = t.healthChecks?.list?.useQuery?.({ deploymentId: firstDeployId }, { enabled: !!firstDeployId })
  const checks = healthQ?.data || []

  const loading = deploysQ.isLoading

  if (loading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader title="Health Checks" icon={HeartPulse} action={
        <Button variant="ghost" size="sm" onClick={() => deploysQ.refetch()} className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", deploysQ.isRefetching && "animate-spin")} /> Refresh
        </Button>
      } />

      {checks.length === 0 ? (
        <EmptyState icon={HeartPulse} title="No health checks configured." subtitle="Health checks will appear here once services are deployed with monitoring enabled." />
      ) : (
        <div className="space-y-3">
          {checks.map((check: any) => {
            const isHealthy = check.last_status === true || check.last_status === 'healthy'
            return (
              <Card key={check.id} className="flex items-center gap-4 py-4">
                <div className={cn("p-2.5 rounded-lg",
                  isHealthy ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold">{check.endpoint}</p>
                    <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest">{check.check_type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Every {check.interval_seconds}s</span>
                    {check.response_time && <span>{check.response_time}ms</span>}
                    {check.last_checked && <span>{formatDistanceToNow(new Date(check.last_checked))} ago</span>}
                  </div>
                </div>
                <div className={cn("text-[10px] font-bold uppercase tracking-widest",
                  isHealthy ? "text-emerald-400" : "text-red-400"
                )}>
                  {isHealthy ? "Healthy" : "Down"}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Uptime summary from deployments */}
      {deployments.length > 0 && (
        <div>
          <SectionHeader title="Recent Deployments Health" icon={HeartPulse} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deployments.slice(0, 6).map((d: any) => (
              <Card key={d.id} className="flex items-center gap-3 py-3">
                <div className={cn("w-2 h-2 rounded-full",
                  d.status === 'success' ? "bg-emerald-500" : d.status === 'failed' ? "bg-red-500" : "bg-amber-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{d.summary || d.branch || 'Deployment'}</p>
                  <p className="text-[10px] text-muted-foreground">{d.created_at && formatDistanceToNow(new Date(d.created_at))} ago</p>
                </div>
                <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest">{d.status}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
