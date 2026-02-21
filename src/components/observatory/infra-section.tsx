"use client"

import { Globe, HardDrive, Shield, BarChart3, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState, SectionHeader } from "./shared"

export const InfraSection = ({ projectSlug }: { projectSlug: string }) => {
  const t = trpc as any
  const domainsQ = t.commandCenter.getDomains.useQuery({ projectSlug })
  const storageQ = t.commandCenter.getStorage.useQuery({ projectSlug })
  const firewallQ = t.commandCenter.getFirewall.useQuery({ projectSlug })
  const usageQ = t.commandCenter.getDetailedUsage.useQuery({ projectSlug })
  const analyticsQ = t.commandCenter.getAnalytics.useQuery({ projectSlug })

  const domains = domainsQ.data || []
  const storage = storageQ.data || []
  const firewall = firewallQ.data || []
  const usage = usageQ.data || []
  const analytics = analyticsQ.data || []

  const loading = domainsQ.isLoading || storageQ.isLoading || firewallQ.isLoading || usageQ.isLoading || analyticsQ.isLoading

  if (loading) return <div className="flex justify-center py-20"><GridLoader /></div>

  const hasNoData = domains.length === 0 && storage.length === 0 && firewall.length === 0 && usage.length === 0 && analytics.length === 0

  if (hasNoData) {
    return <EmptyState icon={Database} title="No infrastructure data yet." subtitle="Connect providers and deploy to see domains, storage, firewall rules, and usage analytics." />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Domains */}
      {domains.length > 0 && (
        <div>
          <SectionHeader title="Domains" icon={Globe} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((d: any, i: number) => (
              <Card key={i} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm font-mono">{d.domain}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{d.provider || d.providerId}</p>
                  </div>
                  <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold tracking-widest", d.sslStatus === 'valid' ? 'text-emerald-400' : 'text-amber-400')}>
                    SSL: {d.sslStatus}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Storage */}
      {storage.length > 0 && (
        <div>
          <SectionHeader title="Storage" icon={HardDrive} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storage.map((s: any, i: number) => (
              <Card key={i} className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-muted border border-border"><HardDrive className="w-4 h-4" /></div>
                  <div>
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{s.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.usage} {s.unit}</span>
                  <Badge variant="secondary" className="text-[9px]">{s.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Firewall */}
      {firewall.length > 0 && (
        <div>
          <SectionHeader title="Firewall & Security Rules" icon={Shield} />
          <div className="space-y-3">
            {firewall.map((fw: any, i: number) => (
              <Card key={i} className="flex items-center gap-4 py-4">
                <div className={cn("p-2 rounded-lg", fw.status === 'enabled' ? 'bg-emerald-500/10' : 'bg-zinc-500/10')}>
                  <Shield className={cn("w-4 h-4", fw.status === 'enabled' ? 'text-emerald-400' : 'text-zinc-400')} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{fw.name}</p>
                  <p className="text-xs text-muted-foreground">{fw.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{fw.rulesCount} rules</span>
                  <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold", fw.status === 'enabled' ? 'text-emerald-400' : 'text-zinc-400')}>
                    {fw.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Usage */}
      {usage.length > 0 && (
        <div>
          <SectionHeader title="Resource Usage" icon={BarChart3} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usage.map((u: any, i: number) => {
              const pct = u.limit > 0 ? Math.round((u.current / u.limit) * 100) : 0
              return (
                <Card key={i} className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm">{u.metric}</p>
                    <span className="text-xs font-mono text-muted-foreground">{u.current}/{u.limit} {u.unit}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>{pct}% used</span>
                    {u.resetDate && <span>Resets {u.resetDate}</span>}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics.length > 0 && (
        <div>
          <SectionHeader title="Provider Analytics" icon={BarChart3} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {analytics.map((a: any, i: number) => (
              <Card key={i} className="text-center py-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{a.name}</p>
                <p className="text-2xl font-bold tracking-tight">{typeof a.value === 'number' && a.value > 9999 ? `${(a.value / 1000).toFixed(0)}k` : a.value}</p>
                {a.change != null && (
                  <p className={cn("text-[10px] font-bold mt-1", a.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {a.change >= 0 ? '↑' : '↓'} {Math.abs(a.change)}%
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/50 mt-1">{a.timeRange}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
