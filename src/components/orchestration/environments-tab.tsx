"use client"

import { Layers, Server, GitBranch, Globe, MoreVertical, ShieldAlert, ChevronRight, Plus } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const EnvironmentsTab = ({ setShowModal }: { setShowModal: (v: boolean) => void }) => {
  const envsQuery = trpc.environments.all.useQuery()
  const environments = envsQuery?.data || []

  const getTypeColor = (type?: string) => {
    if (!type) return "text-muted-foreground border-border bg-muted"
    switch (type.toLowerCase()) {
      case "production": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
      case "staging": return "text-amber-500 border-amber-500/20 bg-amber-500/5"
      default: return "text-muted-foreground border-border bg-muted"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Layers className="w-4 h-4" /> Active Environments
           </h3>
           <p className="text-xs text-muted-foreground font-medium">
             {environments.length} Active {environments.length === 1 ? 'Cluster' : 'Clusters'}
           </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-2" /> New Cluster
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {envsQuery.isLoading ? (
          <div className="col-span-full py-20"><LoadingScreen title="Synchronizing Clusters" subtitle="Broadcasting discovery packets..." /></div>
        ) : environments.length === 0 ? (
           <div className="col-span-full py-24 text-center border border-dashed border-border rounded-xl bg-muted/20">
             <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
             <p className="text-sm font-bold text-foreground mb-1">No infrastructure clusters configured.</p>
             <p className="text-xs text-muted-foreground mb-6">Provision your first environment to begin orchestrating resources.</p>
             <Button onClick={() => setShowModal(true)} variant="outline" className="text-[10px] font-bold uppercase tracking-widest h-9">
                Provision Infrastructure
             </Button>
           </div>
        ) : (
          environments.map((env: any) => (
            <div key={env.id} className="bg-card border border-border rounded-xl p-6 group hover:border-foreground/20 transition-all shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                 <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0"><Server className="w-5 h-5 text-foreground" /></div>
                <div>
                  <h4 className="font-bold text-foreground text-sm tracking-tight">{env.name}</h4>
                  <Badge variant="outline" className={cn("mt-1.5 text-[9px] px-2 py-0.5 rounded-md border uppercase font-bold tracking-widest", getTypeColor(env.type))}>{env.type}</Badge>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 opacity-50" /> Branch</span>
                    <code className="text-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border text-[10px]">{env.branch || 'main'}</code>
                 </div>
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium flex items-center gap-2"><Globe className="w-3.5 h-3.5 opacity-50" /> Region</span>
                    <span className="text-foreground font-bold uppercase">{env.region || 'US-EAST-1'}</span>
                 </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg mb-6">
                 <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-[11px] font-bold text-foreground leading-none">Maintenance Mode</p>
                      <p className="text-[9px] text-muted-foreground mt-1">Temporarily block all traffic with a 503 screen</p>
                    </div>
                 </div>
                 <button className="relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent focus:outline-none transition-colors bg-muted hover:bg-muted-foreground/30">
                    <span className="pointer-events-none block h-3 w-3 rounded-full bg-foreground shadow-lg ring-0 transition-transform translate-x-[-8px]"></span>
                 </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", env.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{env.status}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-2 hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
                   Manage <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
