import React from 'react'
import { Box, GitBranch, RefreshCw, MoreVertical, ExternalLink, Settings, Pause, Play, Trash2, Activity, Zap, HardDrive, Layers } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function formatTimeAgo(date: Date) {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'JUST NOW';
  if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
  return `${Math.floor(diff / 86400)}D AGO`;
}

export const ProjectCard = React.memo(({ project, router, onToggleStatus, onDelete }: { project: any, router: any, onToggleStatus: () => void, onDelete: () => void }) => {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all duration-700 cursor-pointer overflow-hidden shadow-2xl ring-1 ring-inset ring-white/[0.01]"
      onClick={() => router.push(`/projects/${project.slug}`)}
    >
      {/* Decorative background pulse for active projects */}
      {isOnline && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.02] blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-emerald-500/[0.05] transition-all duration-1000" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 border shadow-2xl ring-1 ring-inset",
              isOnline 
                ? "bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-400/60 ring-emerald-500/[0.01]" 
                : "bg-white/[0.01] border-white/5 text-muted-foreground/10 ring-white/[0.01]"
            )}>
              {project.framework === 'nextjs' ? (
                <svg viewBox="0 0 180 180" width="28" height="28" className="fill-current opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                   <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.095C143.333 162.014 146.509 159.818 149.508 157.52Z" />
                   <rect height="72" width="12" x="115" y="54" />
                </svg>
              ) : (
                <Layers className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-[14px] font-black tracking-[0.1em] text-foreground/80 uppercase mb-2 group-hover:text-foreground transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">{project.slug}</span>
                {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-muted-foreground/10 hover:text-foreground transition-all duration-700">
                   <MoreVertical className="w-5 h-5" />
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0a] border-white/5 p-2 shadow-3xl rounded-[1.5rem]">
                 <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] px-4 py-3">Node_Operation_Matrix</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}`)} className="rounded-xl gap-4 text-[11px] font-black uppercase tracking-widest py-3 px-4 hover:bg-white/[0.03] focus:bg-white/[0.03] transition-all">
                   <Activity className="w-4 h-4 text-indigo-400/40" />
                   Observatory_Hub
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}/settings`)} className="rounded-xl gap-4 text-[11px] font-black uppercase tracking-widest py-3 px-4 hover:bg-white/[0.03] focus:bg-white/[0.03] transition-all">
                   <Settings className="w-4 h-4 text-muted-foreground/20" />
                   Node_Protocols
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem onClick={onToggleStatus} className="rounded-xl gap-4 text-[11px] font-black uppercase tracking-widest py-3 px-4 hover:bg-white/[0.03] focus:bg-white/[0.03] transition-all">
                   {isOnline ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-500/40" />
                        Hibernation_Protocol
                      </>
                   ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-500/40" />
                        Awaken_Node
                      </>
                   )}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem 
                    className="rounded-xl gap-4 text-[11px] font-black uppercase tracking-widest py-3 px-4 text-red-400/40 focus:text-red-400 focus:bg-red-500/10 transition-all"
                    onClick={onDelete}
                 >
                   <Trash2 className="w-4 h-4" />
                   Termination_Protocol
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* High-density metrics row */}
        <div className="grid grid-cols-3 gap-6 mb-10 pt-8 border-t border-white/5">
           <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 ring-1 ring-inset ring-white/[0.01]">
             <p className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em] mb-2">Runtime</p>
             <div className="flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-amber-500/20" />
               <span className="text-[11px] font-black tabular-nums text-foreground/40 font-mono tracking-widest">1.2s</span>
             </div>
           </div>
           <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 ring-1 ring-inset ring-white/[0.01]">
             <p className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em] mb-2">Memory</p>
             <div className="flex items-center gap-2">
               <HardDrive className="w-3.5 h-3.5 text-indigo-500/20" />
               <span className="text-[11px] font-black tabular-nums text-foreground/40 font-mono tracking-widest">256MB</span>
             </div>
           </div>
           <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 ring-1 ring-inset ring-white/[0.01]">
             <p className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em] mb-2">Integrity</p>
             <div className="flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-emerald-500/20" />
               <span className="text-[11px] font-black tabular-nums text-foreground/40 font-mono tracking-widest">99.9%</span>
             </div>
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-8 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.3em]">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 text-muted-foreground/20 group-hover:text-indigo-400/40 transition-all duration-700">
               <GitBranch className="w-4 h-4" />
               <span className="font-mono text-[9px]">{project.autoDeployBranch || 'MAIN'}</span>
             </div>
           </div>
           <div className="flex items-center gap-3 text-muted-foreground/10">
             <RefreshCw className={cn("w-3.5 h-3.5", project.status === 'active' && "animate-spin-slow")} />
             <span className="font-mono text-[9px]">
               {project.lastDeployedAt ? formatTimeAgo(new Date(project.lastDeployedAt)) : 'NULL_MANIFEST'}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
})
ProjectCard.displayName = "ProjectCard"
