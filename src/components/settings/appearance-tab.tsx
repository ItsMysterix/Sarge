"use client"

import { motion } from "framer-motion"
import { Moon, Sun, Monitor, Palette, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AppearanceTabProps {
  themeMode: "dark" | "light" | "system"
  enableAnimations: boolean
  onThemeChange: (theme: "dark" | "light" | "system") => void
  onAnimationsToggle: (enabled: boolean) => void
}

export function AppearanceTab({
  themeMode,
  enableAnimations,
  onThemeChange,
  onAnimationsToggle
}: AppearanceTabProps) {
  const themes = [
    { id: "dark" as const, label: "Obsidian", icon: Moon, description: "Industrial default shell matrix", color: "indigo" },
    { id: "light" as const, label: "Lustre", icon: Sun, description: "Solarized prism protocols", color: "amber" },
    { id: "system" as const, label: "Neural", icon: Monitor, description: "Inherit system core kernel", color: "emerald" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Visual Interface Protocol */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.1)]">
            <Palette className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Visual Interface Protocol</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Shell rendering environment & chromatic displacement logic</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {themes.map((theme) => {
            const Icon = theme.icon
            const isActive = themeMode === theme.id
            
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={cn(
                  "p-10 rounded-[2rem] border transition-all duration-700 group/item relative overflow-hidden flex flex-col items-center gap-10 ring-1 ring-inset ring-white/[0.01]",
                  isActive 
                    ? 'bg-white/[0.03] border-indigo-500/30 shadow-2xl shadow-indigo-500/[0.02]' 
                    : 'bg-[#050505] border-white/5 hover:border-white/10'
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-6">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                  </div>
                )}
                
                <div className={cn(
                  "w-20 h-20 rounded-2xl border flex items-center justify-center transition-all duration-700",
                  isActive 
                    ? 'bg-indigo-500/10 border-indigo-500/20 shadow-inner' 
                    : 'bg-[#0a0a0a] border-white/5 group-hover/item:border-white/10'
                )}>
                  <Icon className={cn(
                    "w-8 h-8 transition-all duration-700",
                    isActive ? 'text-indigo-400 scale-110' : 'text-muted-foreground/10 group-hover/item:text-muted-foreground/30'
                  )} />
                </div>

                <div className="text-center space-y-3">
                  <div className={cn(
                    "text-[13px] font-black uppercase tracking-[0.3em] transition-all duration-700",
                    isActive ? 'text-foreground' : 'text-muted-foreground/20'
                  )}>
                    {theme.label}
                  </div>
                  <div className={cn(
                    "text-[9px] font-bold uppercase tracking-widest leading-relaxed px-2 transition-all duration-700",
                    isActive ? 'text-muted-foreground/40' : 'text-muted-foreground/5 group-hover/item:text-muted-foreground/10'
                  )}>
                    {theme.description}
                  </div>
                </div>

                {!isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 translate-y-full group-hover/item:translate-y-0 transition-transform duration-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Kinetic Engine Matrix */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.1)]">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Kinetic Engine Matrix</h3>
              <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Dynamics orchestrator & motion physics registry</p>
            </div>
          </div>
          <Badge variant="outline" className="h-8 px-5 border-amber-500/10 bg-amber-500/5 text-amber-500/60 text-[8px] font-black uppercase tracking-[0.2em] rounded-xl">
            SYNCHRONIZED_ACTIVE
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] flex items-center justify-between group/item hover:border-white/10 transition-all duration-700 shadow-xl ring-1 ring-inset ring-white/[0.01]">
            <div className="space-y-3">
              <div className="text-[12px] font-black text-foreground/80 uppercase tracking-[0.2em] group-hover/item:text-foreground transition-colors">Manifest Transitions</div>
              <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest leading-relaxed group-hover/item:text-muted-foreground/30 transition-colors">Global kinetic state orchestration</p>
            </div>
            <button
              onClick={() => onAnimationsToggle(!enableAnimations)}
              className={cn(
                "relative w-16 h-8 rounded-full transition-all duration-1000 p-1 border",
                enableAnimations ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0a0a] border-white/5'
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-[0.5rem] transition-all duration-700 shadow-2xl",
                  enableAnimations 
                    ? 'bg-amber-500 translate-x-8 shadow-amber-500/40' 
                    : 'bg-white/5 translate-x-0'
                )}
              />
            </button>
          </div>
          
          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] opacity-30 group/item hover:border-white/10 transition-all duration-1000 grayscale cursor-not-allowed ring-1 ring-inset ring-white/[0.01]">
            <div className="flex items-center justify-between mb-0">
               <div className="space-y-3">
                 <div className="text-[12px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Reduced Friction Protocol</div>
                 <p className="text-[9px] font-bold text-muted-foreground/5 uppercase tracking-widest leading-relaxed">Accessibility mitigation logic</p>
               </div>
               <Badge className="h-6 px-3 border-white/5 bg-[#0a0a0a] text-muted-foreground/10 text-[7px] font-black tracking-widest rounded-lg">PROV_NULL</Badge>
            </div>
            <div className="mt-8 text-[7px] font-black text-amber-500/10 uppercase tracking-[0.4em]">STAGED: Roadmap_L7_Deployment</div>
          </div>
        </div>
      </div>

      {/* Information Density Matrix */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-10">
           <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <Monitor className="w-6 h-6 text-emerald-400" />
           </div>
           <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Information Density Matrix</h3>
              <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Data weighting & information entropy orchestration</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] flex items-center justify-between group/item hover:border-white/10 transition-all duration-700 shadow-xl ring-1 ring-inset ring-white/[0.01]">
             <div className="space-y-3">
                <div className="text-[12px] font-black text-foreground/80 uppercase tracking-[0.2em] group-hover/item:text-foreground transition-colors">Industrial Saturation</div>
                <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest leading-relaxed group-hover/item:text-muted-foreground/30 transition-colors">Maximum telemetry manifest visualization</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/40">ACTIVE_MESH</span>
             </div>
          </div>

          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] opacity-30 group/item hover:border-white/10 transition-all duration-1000 grayscale cursor-not-allowed ring-1 ring-inset ring-white/[0.01]">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="text-[12px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Simplified Buffer Mode</div>
                <p className="text-[9px] font-bold text-muted-foreground/5 uppercase tracking-widest leading-relaxed">Abstraction layer for data minimalism</p>
              </div>
              <Badge className="h-6 px-3 border-white/5 bg-[#0a0a0a] text-muted-foreground/10 text-[7px] font-black tracking-widest rounded-lg">PROV_NULL</Badge>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
