"use client"

import { Brain } from "lucide-react"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
}

export function LoadingScreen({ title = "Initializing", subtitle = "Please wait…" }: LoadingScreenProps) {
  return (
    <div className="flex-1 min-h-[400px] w-full flex items-center justify-center p-6 animate-fade-in">
      <div className="relative max-w-sm w-full">
        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-foreground/5 blur-2xl rounded-full opacity-50" />
        
        <div className="relative bg-card border border-border rounded-3xl p-10 shadow-2xl text-center overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center shadow-inner group">
                <Brain className="w-8 h-8 text-foreground/80 animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground mb-8 font-medium">
              {subtitle}
            </p>

            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
           <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-muted/30 border border-border/50">
              <div className="w-1 h-1 rounded-full bg-foreground/40 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">
                Sarge Terminal
              </span>
           </div>
        </div>
      </div>
    </div>
  )
}
