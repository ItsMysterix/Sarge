"use client"

import { Cloud, Globe2, Zap, Plug, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TargetsTabProps {
  providers: any[]
  onToggleProvider: (id: string, currentStatus: string) => void
}

export function TargetsTab({ providers, onToggleProvider }: TargetsTabProps) {
  const getIcon = (kind: "containers" | "functions" | "static" | string) => {
    if (kind === "static") return <Globe2 className="w-5 h-5 text-indigo-400/40" />
    if (kind === "functions") return <Zap className="w-5 h-5 text-amber-400/40" />
    return <Cloud className="w-5 h-5 text-emerald-400/40" />
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Mesh Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.1)]">
            <Cloud className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Deployment Edge Mesh</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Orchestrate cross-cloud provisioning targets & resource identifiers</p>
          </div>
        </div>
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={cn(
              "p-10 bg-[#0a0a0a] border border-white/5 rounded-[2rem] flex flex-col justify-between group hover:border-white/10 transition-all duration-700 shadow-xl ring-1 ring-inset ring-white/[0.01]",
              provider.status === "connected" && "border-emerald-500/10 shadow-emerald-500/[0.02]"
            )}
          >
            <div className="space-y-8">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-6">
                   <div className={cn(
                     "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700",
                     provider.status === "connected" 
                       ? "bg-[#050505] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                       : "bg-[#050505] border-white/5 group-hover:border-indigo-500/20"
                   )}>
                     {getIcon(provider.kind)}
                   </div>
                   <div className="space-y-1.5">
                     <h3 className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground/80 group-hover:text-foreground transition-colors">{provider.name}</h3>
                     <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-relaxed group-hover:text-muted-foreground/40 transition-colors">{provider.description}</p>
                   </div>
                 </div>
                 
                 <Badge variant="outline" className={cn(
                   "h-6 px-4 text-[7px] font-black uppercase tracking-[0.2em] border-white/5 bg-[#050505] transition-all duration-700",
                   provider.status === 'connected' ? "text-emerald-400/60 border-emerald-500/10" : "text-muted-foreground/10"
                 )}>
                   {provider.status === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
                   {provider.status.toUpperCase()}
                 </Badge>
               </div>

               <div className="flex items-center gap-3 pt-4">
                 <div className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">
                   {provider.badge}
                 </div>
                 <div className="text-[8px] font-black text-indigo-400/20 uppercase tracking-[0.3em] group-hover:text-indigo-400/40 transition-all">
                   {provider.costHint}
                 </div>
               </div>
            </div>

            <button
              onClick={() => onToggleProvider(provider.id, provider.status)}
              className={cn(
                "mt-12 w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 border flex items-center justify-center gap-4",
                provider.status === 'connected' 
                  ? "bg-[#050505] text-red-400/40 border-red-500/5 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5" 
                  : "bg-[#050505] text-foreground/20 border-white/5 hover:text-foreground/80 hover:border-white/10 hover:bg-white/[0.03]"
              )}
            >
              {provider.status === 'connected' ? (
                <>
                   <Plug className="w-4 h-4 opacity-40 group-hover:opacity-100" /> SEVER_UPLINK
                </>
              ) : (
                <>
                   <LinkIcon className="w-4 h-4 opacity-40 group-hover:opacity-100" /> INITIALIZE_LINK
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
