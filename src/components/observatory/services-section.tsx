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

  // State to simulate action menus without full shadcn dropdown for portability
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
      {services.length === 0 ? (
        <div className="col-span-full"><EmptyState icon={Layers} title="No services registered yet." /></div>
      ) : services.map((service: any) => (
        <Card key={service.id} className="hover:border-foreground/20 transition-colors relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted border border-border"><Layers className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-sm">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", service.status === 'up' ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{service.status}</span>
                </div>
              </div>
            </div>
            {/* Action Menu */}
            <div className="relative">
              <button 
                onClick={() => setOpenMenu(openMenu === service.id ? null : service.id)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {openMenu === service.id && (
                <div className="absolute top-8 right-0 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <button className="w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-muted flex items-center gap-2 text-foreground transition-colors">
                      <TerminalSquare className="w-3.5 h-3.5" /> Web Shell
                   </button>
                   <button className="w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-muted flex items-center gap-2 text-amber-500 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Restart Service
                   </button>
                   <button className="w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-red-500/10 flex items-center gap-2 text-red-500 transition-colors border-t border-border mt-1 pt-2">
                      <Power className="w-3.5 h-3.5" /> Suspend
                   </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Uptime</p>
              <p className="text-xs font-bold">{Number(service.uptime_percent).toFixed(1)}%</p>
            </div>
            <div className="p-2.5 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Latency</p>
              <p className="text-xs font-bold">{service.latency || "--"}</p>
            </div>
            <div className="p-2.5 bg-muted/30 rounded-lg text-center border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Cost</p>
              <p className="text-xs font-bold">${Number(service.cost_hr).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
