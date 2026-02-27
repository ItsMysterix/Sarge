"use client"

import { GridLoader } from "./grid-loader"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
}

export function LoadingScreen({ title = "Initializing_Protocol_Kernel", subtitle = "Awaiting_System_Signal…" }: LoadingScreenProps) {
  return (
    <div className="flex-1 min-h-[400px] w-full flex items-center justify-center p-12 animate-in fade-in duration-1000 text-foreground bg-[#050505]">
      <div className="flex flex-col items-center relative">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        {/* The "Four Squares" Grid Loader */}
        <div className="relative z-10 transition-transform duration-1000 hover:scale-150">
          <GridLoader className="mb-12 scale-150" />
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-[12px] font-black uppercase tracking-[0.5em] mb-4 text-foreground/80">{title}</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-[9px] text-muted-foreground/20 font-black uppercase tracking-[0.3em]">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
