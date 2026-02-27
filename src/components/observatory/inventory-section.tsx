"use client"

import { Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState } from "./shared"

export const InventorySection = ({ projectSlug }: { projectSlug: string }) => {
  const inventoryQuery = (trpc as any).commandCenter.getInventory.useQuery({ projectSlug })
  const resources = inventoryQuery.data || []
  const isLoading = inventoryQuery.isLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse ring-1 ring-inset ring-white/[0.02]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400">DISCOVERY_LOCKED</span>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <Box className="w-5 h-5 text-indigo-400 relative z-10" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Kinetic Asset Matrix</h2>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.25em] mt-1.5">
              Telemetry discovered {resources.length} active infrastructure entropy nodes
            </p>
          </div>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="py-40 border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-white/[0.01] space-y-8">
          <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
            <Box className="w-8 h-8 text-muted-foreground/10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40">Discovery Void</h3>
            <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest max-w-sm leading-relaxed">Connect cloud providers and bridge provisioning engine to initialize kinetic asset discovery.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((res: any) => (
            <div key={res.id} className="group bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all duration-500 hover:bg-white/[0.03] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-6">
                <Badge variant="outline" className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] px-3 h-6 border-white/5",
                  res.status === 'active' || res.status === 'running' 
                    ? "bg-emerald-500/5 text-emerald-400/60 border-emerald-500/10" 
                    : "bg-white/5 text-muted-foreground/20"
                )}>
                  {res.status?.toUpperCase() || 'PROTO_STABLE'}
                </Badge>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 group-hover:border-indigo-500/20 transition-colors">
                  <Box className="w-5 h-5 text-muted-foreground/20 group-hover:text-indigo-400/60 transition-colors" />
                </div>
                <h3 className="text-[11px] font-black tracking-[0.15em] text-foreground/90 truncate mb-2 uppercase">{res.name}</h3>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                   <p className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">TYPE: {(res.type || 'KERNEL_CORE').split(':').pop()?.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex flex-col gap-1">
                   <span className="text-[7px] font-black text-muted-foreground/10 uppercase tracking-widest">REGION_LOCK</span>
                   <span className="text-[9px] font-mono font-black text-muted-foreground/40 uppercase tracking-tighter">{res.region?.toUpperCase() || 'GLOBAL_CORE'}</span>
                </div>
                <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/60">{res.providerId?.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
