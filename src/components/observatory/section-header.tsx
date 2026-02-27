import React from "react"

export const SectionHeader = ({ title, icon: Icon, action }: { title: string; icon: any; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-12 pb-10 border-b border-white/5">
    <div className="flex items-center gap-6">
       <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.1)]">
          <Icon className="w-5 h-5 text-indigo-400" />
       </div>
       <div className="flex flex-col">
          <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">
            {title}
          </h3>
          <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-1 italic">Real-time telemetry manifestation</p>
       </div>
    </div>
    {action}
  </div>
)
