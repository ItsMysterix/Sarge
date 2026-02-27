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

  if (envsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-80 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] animate-pulse ring-1 ring-inset ring-white/[0.01]" />
        ))}
      </div>
    )
  }

  const getTypeColor = (type?: string) => {
    if (!type) return "text-muted-foreground border-white/5 bg-white/5"
    switch (type.toLowerCase()) {
      case "production": return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
      case "staging": return "text-indigo-400 border-indigo-500/20 bg-indigo-500/5"
      default: return "text-muted-foreground border-white/5 bg-white/5"
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center ring-1 ring-inset ring-white/[0.01] shadow-2xl">
             <Layers className="w-7 h-7 text-muted-foreground/20" />
           </div>
           <div>
             <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Active_Fleet_Registry</h3>
             <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
               {environments.length}_Sovereign_Infrastructure_Nodes_Synchronized
             </p>
           </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="h-14 px-8 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-4">
          <Plus className="w-5 h-5" /> Manifest_New_Cluster
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {environments.length === 0 ? (
           <div className="col-span-full py-48 text-center border border-dashed border-white/5 rounded-[3rem] bg-[#050505] ring-1 ring-inset ring-white/[0.01] shadow-2xl">
             <Layers className="w-20 h-20 text-muted-foreground/5 mx-auto mb-10" />
             <p className="text-[14px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-4">FLEET_VOID_DETECTED</p>
             <p className="text-[10px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
               No infrastructure clusters have been provisioned in this orchestration protocol path.
             </p>
             <Button onClick={() => setShowModal(true)} variant="outline" className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.3em] border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all rounded-[1.5rem] shadow-xl">
                Initialize_Sovereign_Cluster
             </Button>
           </div>
        ) : (
          environments.map((env: any) => (
            <div key={env.id} className="relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 group hover:border-white/10 transition-all duration-700 shadow-2xl overflow-hidden ring-1 ring-inset ring-white/[0.01]">
              <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
                 <button className="text-muted-foreground/20 hover:text-foreground transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
              
              <div className="flex items-start gap-8 mb-10">
                <div className="w-16 h-16 rounded-[1.25rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:border-indigo-500/30 transition-all duration-700">
                  <Server className="w-8 h-8 text-muted-foreground/10 group-hover:text-indigo-400/40 transition-all duration-700" />
                </div>
                <div className="min-w-0 flex-1 pt-2">
                  <h4 className="font-black text-foreground/90 text-[14px] tracking-[0.1em] uppercase truncate mb-3">{env.name}</h4>
                  <div className={cn("inline-flex items-center px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em]", getTypeColor(env.type))}>
                    {env.type || 'Standard'}_ORCHESTRATION_PATH
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] p-5 ring-1 ring-inset ring-white/[0.01]">
                  <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5" /> Registry
                  </p>
                  <code className="text-[11px] font-black font-mono text-foreground/50 uppercase tracking-widest truncate block">
                    {env.branch || 'MAIN'}
                  </code>
                </div>
                <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] p-5 ring-1 ring-inset ring-white/[0.01]">
                  <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Topology
                  </p>
                  <span className="text-[11px] font-black text-foreground/50 uppercase tracking-widest block font-mono">
                    {env.region || 'US-EAST-1'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-[1.5rem] mb-10 group/toggle hover:bg-white/[0.03] transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-amber-500/20 group-hover/toggle:text-amber-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground/60 uppercase tracking-tight leading-none group-hover/toggle:text-foreground">Maintenance_Mode</p>
                      <p className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] mt-2">503_INTERCEPT_ACTIVE</p>
                    </div>
                 </div>
                 <button className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent focus:outline-none transition-colors bg-white/5 hover:bg-white/10">
                    <div className="pointer-events-none block h-4 w-4 rounded-full bg-white/10 shadow-lg ring-0 transition-all translate-x-[-12px]"></div>
                 </button>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full transition-all duration-1000", env.status === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" : "bg-white/5")} />
                  <span className="text-[10px] text-muted-foreground/20 uppercase font-black tracking-[0.3em]">{env.status ? env.status.toUpperCase() : 'OFFLINE_STATE'}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/10 hover:text-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-700 gap-3 group/btn">
                   Node_Command_Deck <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
