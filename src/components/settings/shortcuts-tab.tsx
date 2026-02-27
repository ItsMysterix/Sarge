"use client"

import { motion } from "framer-motion"
import { Keyboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ShortcutsTab() {
  const protocols = [
    { category: "Navigation_Mesh", items: [
      { keys: ["⌘", "K"], description: "Global query engine" },
      { keys: ["⌘", "D"], description: "Bridge dashboard" },
      { keys: ["⌘", "M"], description: "Metrics telemetry" },
      { keys: ["⌘", "L"], description: "Stream logs" },
    ]},
    { category: "Logic_Orchestration", items: [
      { keys: ["⌘", "S"], description: "Commit state" },
      { keys: ["⌘", "R"], description: "Resync telemetry" },
      { keys: ["⌘", "N"], description: "Manifest deployment" },
      { keys: ["⌘", "⇧", "P"], description: "Protocol orchestrator" },
    ]},
    { category: "Buffer_Operations", items: [
      { keys: ["⌘", "Z"], description: "Revert state" },
      { keys: ["⌘", "⇧", "Z"], description: "Forward state" },
      { keys: ["⌘", "C"], description: "Capture buffer" },
      { keys: ["⌘", "V"], description: "Inject buffer" },
    ]},
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <Keyboard className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Interface Control Protocols</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Configure kinetic interface bindings & rapid orchestration triggers</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {protocols.map((section, idx) => (
            <div key={idx} className="space-y-8">
              <h4 className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" /> {section.category}
              </h4>
              <div className="space-y-3">
                {section.items.map((protocol, sidx) => (
                  <div key={sidx} className="flex items-center justify-between p-5 bg-[#050505] border border-white/5 rounded-2xl group hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01]">
                    <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest group-hover:text-muted-foreground/60 transition-colors">{protocol.description}</span>
                    <div className="flex gap-2">
                      {protocol.keys.map((key, kidx) => (
                        <kbd 
                          key={kidx}
                          className="min-w-[28px] h-7 flex items-center justify-center bg-[#0a0a0a] border border-white/10 rounded-lg text-[10px] font-black font-mono text-foreground/40 group-hover:border-indigo-500/30 group-hover:text-indigo-400/60 transition-all shadow-inner"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl opacity-30 cursor-not-allowed group">
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Custom Matrix Override</h3>
            <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest">User-defined Kinetic protocol orchestration</p>
          </div>
          <Badge className="h-8 px-5 border-white/5 bg-white/[0.02] text-muted-foreground/20 font-black tracking-[0.2em] text-[8px] rounded-xl">
             DEVELOPMENT_LOCKED
          </Badge>
        </div>
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
           <button disabled className="px-8 h-12 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/10">
             INITIALIZE_CUSTOM_MATRIX
           </button>
           <div className="text-[8px] font-black text-muted-foreground/5 mt-6 uppercase tracking-[0.4em]">Protocol Roadmap: Q4_SYNC</div>
        </div>
      </div>
    </motion.div>
  )
}
