"use client"

import { Layers, MoreVertical, RefreshCw, Power, TerminalSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState } from "./shared"
import { useState } from "react"

export const ServicesSection = () => {
  const t = trpc as any
  const { data: services = [], isLoading } = t.services.all.useQuery(undefined, { refetchOnWindowFocus: false })
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {services.length === 0 ? (
        <div className="col-span-full py-32 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
          <Layers className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Service Registry Empty</h3>
          <p className="text-[10px] text-muted-foreground/40 mt-1">No microservices detected in the current orchestration cluster.</p>
        </div>
      ) : services.map((service: any) => (
        <div key={service.id} className="group bg-[#080808] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all relative shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                <Layers className="w-5 h-5 text-muted-foreground group-hover:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight text-foreground/90">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full", 
                    service.status === 'up' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  )} />
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">{service.status}</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setOpenMenu(openMenu === service.id ? null : service.id)}
                className="p-2 text-muted-foreground/40 hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenu === service.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                  <div className="absolute top-10 right-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 flex items-center gap-3 text-foreground/80 transition-colors">
                      <TerminalSquare className="w-3.5 h-3.5 opacity-50" /> Web Shell
                    </button>
                    <button className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 flex items-center gap-3 text-amber-500/80 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 opacity-50" /> Restart Node
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 flex items-center gap-3 text-red-500/80 transition-colors">
                      <Power className="w-3.5 h-3.5 opacity-50" /> Kill Process
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Uptime', value: `${Number(service.uptime_percent).toFixed(1)}%`, color: 'text-indigo-400' },
              { label: 'Latency', value: service.latency || "--", color: 'text-emerald-400' },
              { label: 'Cost/hr', value: `$${Number(service.cost_hr).toFixed(2)}`, color: 'text-amber-400' }
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
                <p className={cn("text-xs font-mono font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
