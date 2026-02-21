"use client"

import { ShieldAlert, ShieldCheck, RefreshCw, Bug, Package, ExternalLink, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GridLoader } from "@/components/ui/grid-loader"
import { formatDistanceToNow } from "date-fns"
import { Card, EmptyState, SectionHeader } from "./shared"

export const SecuritySection = ({ projectSlug }: { projectSlug: string }) => {
  const t = trpc as any
  const secQuery = t.commandCenter.getSecurityAlerts.useQuery({ projectSlug })
  const alerts = secQuery.data || []

  // Get repository info for vuln scanning
  const repoQuery = t.repository.list.useQuery()
  const primaryRepo = (repoQuery?.data || []).find((r: any) => r.is_primary)

  const vulnQuery = t.github.getVulnerabilities.useQuery(
    { owner: primaryRepo?.owner, repo: primaryRepo?.repo },
    { enabled: !!primaryRepo?.owner && !!primaryRepo?.repo }
  )
  const depsQuery = t.github.getDependencies.useQuery(
    { owner: primaryRepo?.owner, repo: primaryRepo?.repo },
    { enabled: !!primaryRepo?.owner && !!primaryRepo?.repo }
  )

  const vulns = vulnQuery?.data || { alerts: [], enabled: false }
  const deps = depsQuery?.data || { dependencies: [], totalCount: 0, byEcosystem: {}, byType: {} }

  if (secQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  const severityColor: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    info: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Vulnerability Summary */}
      {vulns.enabled && vulns.alerts?.length > 0 && (
        <div>
          <SectionHeader title={`Vulnerabilities (${vulns.alerts.length})`} icon={Bug} action={
            <Button variant="ghost" size="sm" onClick={() => vulnQuery?.refetch?.()} className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <RefreshCw className={cn("w-3.5 h-3.5 mr-2", vulnQuery?.isRefetching && "animate-spin")} /> Scan
            </Button>
          } />

          {/* Severity summary bar */}
          {vulns.summary && (
            <div className="flex items-center gap-4 mb-4">
              {Object.entries(vulns.summary as Record<string, number>).map(([sev, count]) => {
                if (!count) return null
                return (
                  <div key={sev} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest", severityColor[sev])}>
                    <AlertTriangle className="w-3 h-3" />
                    {count} {sev}
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-2">
            {vulns.alerts.slice(0, 15).map((v: any) => (
              <Card key={v.id} className={cn("flex items-start gap-4 py-3",
                v.severity === 'critical' && "border-l-2 border-l-red-500"
              )}>
                <div className={cn("shrink-0 p-2 rounded-lg border", severityColor[v.severity] || severityColor.info)}>
                  <Bug className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold truncate">{v.summary}</p>
                    <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold tracking-widest border", severityColor[v.severity])}>{v.severity}</Badge>
                    {v.cveId && <span className="text-[10px] text-muted-foreground font-mono">{v.cveId}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="font-mono">{v.package}</span>
                    <span>{v.vulnerableRange}</span>
                    {v.patchedVersion && <span className="text-emerald-400">Fix: {v.patchedVersion}</span>}
                    {v.createdAt && <span>{formatDistanceToNow(new Date(v.createdAt))} ago</span>}
                  </div>
                </div>
                {v.url && (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies Overview */}
      {deps.totalCount > 0 && (
        <div>
          <SectionHeader title={`Dependencies (${deps.totalCount})`} icon={Package} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(deps.byEcosystem as Record<string, number>).map(([eco, count]) => (
              <Card key={eco} className="text-center py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{eco}</p>
                <p className="text-xl font-bold">{count}</p>
              </Card>
            ))}
            {Object.entries(deps.byType as Record<string, number>).map(([type, count]) => (
              <Card key={type} className="text-center py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{type}</p>
                <p className="text-xl font-bold">{count}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Provider Security Findings */}
      <div>
        <SectionHeader title="Provider Security Findings" icon={ShieldAlert} action={
          <Button variant="ghost" size="sm" onClick={() => secQuery.refetch()} className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", secQuery.isRefetching && "animate-spin")} /> Refresh
          </Button>
        } />
        {alerts.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No provider security findings." subtitle="All clear across connected providers." />
        ) : (
          <div className="space-y-3">
            {alerts.map((a: any, i: number) => (
              <Card key={a.id || i} className="flex items-start gap-4 py-4">
                <div className={cn("shrink-0 p-2 rounded-lg border", severityColor[a.severity] || severityColor.info)}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">{a.title}</p>
                    <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold tracking-widest border", severityColor[a.severity])}>{a.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
                    <span className="uppercase font-bold tracking-wider">{a.providerName || a.providerId}</span>
                    {a.timestamp && <span>{formatDistanceToNow(new Date(a.timestamp))} ago</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
