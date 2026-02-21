"use client"

import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState } from "./shared"

export const ServicesSection = () => {
  const t = trpc as any
  const { data: services = [], isLoading } = t.services.all.useQuery(undefined, { refetchOnWindowFocus: false })

  if (isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
      {services.length === 0 ? (
        <div className="col-span-full"><EmptyState icon={Layers} title="No services registered yet." /></div>
      ) : services.map((service: any) => (
        <Card key={service.id} className="hover:border-foreground/20 transition-colors">
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
