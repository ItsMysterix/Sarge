"use client"

import { Cloud, Globe2, Zap, Plug, Link as LinkIcon, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface TargetsTabProps {
  providers: any[]
  onToggleProvider: (id: string, currentStatus: string) => void
}

export function TargetsTab({ providers, onToggleProvider }: TargetsTabProps) {
  const getIcon = (kind: "containers" | "functions" | "static" | string) => {
    if (kind === "static") return <Globe2 className="w-5 h-5 text-white/20" />
    if (kind === "functions") return <Zap className="w-5 h-5 text-white/20" />
    return <Cloud className="w-5 h-5 text-white/20" />
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Mesh Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg">
             <Server className="w-6 h-6 text-white/20" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white uppercase tracking-tight">Deployment Targets</h3>
             <p className="text-xs text-white/20 mt-0.5">Manage cloud providers and infrastructure targets for your services.</p>
           </div>
        </div>
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={provider.id}
            className={cn(
              "p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col justify-between group hover:border-white/10 transition-all shadow-xl",
              provider.status === "connected" && "border-emerald-500/10"
            )}
          >
            <div className="space-y-6">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-5">
                   <div className={cn(
                     "w-14 h-14 rounded-xl flex items-center justify-center border transition-all",
                     provider.status === "connected" 
                       ? "bg-white/[0.02] border-emerald-500/20" 
                       : "bg-white/[0.01] border-white/5 group-hover:bg-white/[0.02]"
                   )}>
                     {getIcon(provider.kind)}
                   </div>
                   <div className="min-w-0">
                     <h3 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors uppercase truncate">{provider.name}</h3>
                     <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mt-1 truncate">{provider.description}</p>
                   </div>
                 </div>
                 
                 <Badge variant="outline" className={cn(
                   "h-5 px-2 text-[8px] font-bold uppercase tracking-widest border-white/5 bg-black transition-all",
                   provider.status === 'connected' ? "text-emerald-400 border-emerald-500/10" : "text-white/10"
                 )}>
                   {provider.status.toUpperCase()}
                 </Badge>
               </div>

               <div className="flex items-center gap-3">
                 <Badge variant="outline" className="text-[8px] font-bold text-white/20 uppercase tracking-widest bg-white/[0.02] border-white/10 opacity-60">
                   {provider.badge}
                 </Badge>
                 <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
                   {provider.costHint}
                 </span>
               </div>
            </div>

            <button
              onClick={() => onToggleProvider(provider.id, provider.status)}
              className={cn(
                "mt-8 w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-3",
                provider.status === 'connected' 
                  ? "bg-black text-red-500/40 border-red-500/10 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20" 
                  : "bg-white text-black border-white hover:bg-zinc-200"
              )}
            >
              {provider.status === 'connected' ? (
                <>
                   <Plug className="w-3.5 h-3.5" /> Disconnect
                </>
              ) : (
                <>
                   <LinkIcon className="w-3.5 h-3.5" /> Connect Target
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
