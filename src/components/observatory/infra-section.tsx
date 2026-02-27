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

  const isLoading = domainsQ.isLoading || storageQ.isLoading || firewallQ.isLoading || usageQ.isLoading || analyticsQ.isLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  const hasNoData = domains.length === 0 && storage.length === 0 && firewall.length === 0 && usage.length === 0 && analytics.length === 0

  if (hasNoData) {
    return (
      <div className="py-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
        <Database className="w-12 h-12 text-muted-foreground/20 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Static Infrastructure</h3>
        <p className="text-[10px] text-muted-foreground/40 mt-1 max-w-sm text-center">Provision storage, domains, or security groups to populate this section.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Domains */}
      {domains.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Globe className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Domain Routing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((d: any, i: number) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-black text-sm tracking-tight truncate text-foreground/90">{d.domain}</p>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">{d.provider || d.providerId}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                    d.sslStatus === 'valid' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-amber-400 bg-amber-500/5 border-amber-500/20'
                  )}>
                    SSL: {d.sslStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storage */}
      {storage.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <HardDrive className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Persistent Volumes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storage.map((s: any, i: number) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5"><HardDrive className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="min-w-0">
                    <p className="font-black text-sm tracking-tight truncate text-foreground/90">{s.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{s.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-indigo-400/80">{s.usage} {s.unit}</span>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest opacity-60 bg-white/5 border-white/10">{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-white/5">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <BarChart3 className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">System Utilization</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usage.map((u: any, i: number) => {
              const pct = u.limit > 0 ? Math.round((u.current / u.limit) * 100) : 0
              return (
                <div key={i} className="bg-[#080808] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{u.metric}</p>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/40">{u.current}/{u.limit} {u.unit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-indigo-500')}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{pct}% Allocated</span>
                    {u.resetDate && <span className="text-[9px] font-bold text-muted-foreground/20">Resets {u.resetDate}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Shield className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Guardrails</h3>
          </div>
          <div className="space-y-3">
            {firewall.map((fw: any, i: number) => (
              <div key={i} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-all">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  fw.status === 'enabled' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-white/5 border-white/10 text-muted-foreground/40'
                )}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-foreground/80 truncate uppercase tracking-tight">{fw.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">{fw.rulesCount} active rules</p>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  fw.status === 'enabled' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-white/10'
                )} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
