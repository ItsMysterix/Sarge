import React from "react"

export const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-48 text-center border border-dashed border-white/5 rounded-[3rem] bg-[#050505] space-y-10 group hover:border-white/10 transition-all duration-1000">
    <div className="w-24 h-24 rounded-[2rem] bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl relative">
      <div className="absolute inset-0 bg-white/[0.01] blur-xl rounded-full animate-pulse" />
      <Icon className="w-10 h-10 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors duration-700 relative z-10" />
    </div>
    <div className="space-y-4">
       <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground/20 group-hover:text-foreground/40 transition-colors duration-700">{title}</h3>
       {subtitle && <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-[0.2em] max-w-[320px] leading-relaxed group-hover:text-muted-foreground/20 transition-colors duration-700 mx-auto">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">
       <div className="w-1 h-1 rounded-full bg-indigo-500/20" />
       <div className="w-1 h-1 rounded-full bg-indigo-500/20" />
       <div className="w-1 h-1 rounded-full bg-indigo-500/20" />
    </div>
  </div>
)
