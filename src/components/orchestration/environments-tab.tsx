"use client"

import { Layers, Server, GitBranch, Globe, MoreVertical, ShieldAlert, ChevronRight, Plus, Activity } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

export const EnvironmentsTab = ({ setShowModal }: { setShowModal: (v: boolean) => void }) => {
  const envsQuery = trpc.environments.all.useQuery()
  const environments = envsQuery?.data || []

  if (envsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 bg-white/[0.01] border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    )
  }

  const getTypeColor = (type?: string) => {
    if (!type) return "text-white/20 border-white/5 bg-white/5"
    switch (type.toLowerCase()) {
      case "production": return "text-emerald-400 border-emerald-500/10 bg-emerald-500/5"
      case "staging": return "text-indigo-400 border-indigo-500/10 bg-indigo-500/5"
      default: return "text-white/20 border-white/5 bg-white/5"
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg">
             <Layers className="w-6 h-6 text-white/20" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white">Active Environments</h3>
             <p className="text-xs text-white/20 mt-0.5">{environments.length} infrastructure nodes connected.</p>
           </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="h-10 px-6 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl">
          <Plus className="w-4 h-4 mr-2" /> New Environment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {environments.length === 0 ? (
           <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] flex flex-col items-center">
             <Activity className="w-16 h-16 text-white/5 mb-8" />
             <h3 className="text-xl font-bold text-white mb-2">No environments yet</h3>
             <p className="text-xs text-white/20 max-w-sm mx-auto leading-relaxed mb-8">
               Start by creating your first environment to begin deploying services.
             </p>
             <Button onClick={() => setShowModal(true)} variant="outline" className="h-12 px-8 text-xs font-bold uppercase tracking-widest border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all">
                Setup Environment
             </Button>
           </div>
        ) : (
          environments.map((env: any, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={env.id} 
              className="relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 group hover:border-white/10 transition-all shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all">
                 <button className="text-white/10 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
              
              <div className="flex items-start gap-5 mb-8">
                <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/[0.05] transition-all">
                  <Server className="w-6 h-6 text-white/10 group-hover:text-white/30 transition-all" />
                </div>
                <div className="min-w-0 pt-1">
                  <h4 className="font-bold text-white/80 text-sm tracking-tight uppercase truncate mb-2 transition-colors group-hover:text-white">{env.name}</h4>
                  <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5", getTypeColor(env.type))}>
                    {env.type || 'Standard'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5" /> Branch
                  </p>
                  <code className="text-xs font-bold text-white/40 uppercase tracking-wider truncate block font-mono">
                    {env.branch || 'main'}
                  </code>
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Region
                  </p>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider block font-mono">
                    {env.region || 'US-EAST-1'}
                   </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-8 group/toggle hover:bg-white/[0.04] transition-all">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-white/20 group-hover/toggle:text-amber-500/40 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest group-hover/toggle:text-white/80 transition-colors">Drain Mode</p>
                      <p className="text-[8px] text-white/10 font-medium uppercase tracking-widest mt-1">Maintenance Traffic Only</p>
                    </div>
                 </div>
                 <button className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors bg-white/5 hover:bg-white/10">
                    <span className="h-3.5 w-3.5 rounded-full bg-white/20 translate-x-1" />
                 </button>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", env.status === 'active' ? "bg-emerald-500 shadow-lg" : "bg-white/5")} />
                  <span className="text-[10px] text-white/10 uppercase font-bold tracking-widest">{env.status || 'inactive'}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-all gap-2 group/btn"
                >
                   Dashboard <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
