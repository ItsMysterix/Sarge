"use client"

import React from 'react'
import { Box, GitBranch, RefreshCw, MoreVertical, ExternalLink, Settings, Pause, Play, Trash2, Activity, Zap, HardDrive, Layers, CheckCircle2 } from 'lucide-react'
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 84600) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const ProjectCard = React.memo(({ project, router, onToggleStatus, onDelete }: { project: any, router: any, onToggleStatus: () => void, onDelete: () => void }) => {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all duration-700 cursor-pointer overflow-hidden shadow-2xl"
      onClick={() => router.push(`/projects/${project.slug}`)}
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.01] blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-white/[0.03] transition-all duration-700" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg",
              isOnline 
                ? "bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-400/60" 
                : "bg-white/[0.01] border-white/5 text-white/10"
            )}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{project.slug}</span>
                {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 text-white/20 hover:text-white transition-all">
                   <MoreVertical className="w-4 h-4" />
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-white/5 p-2 shadow-2xl rounded-2xl">
                 <DropdownMenuLabel className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 py-2">Manage Project</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}`)} className="rounded-xl gap-3 text-xs font-bold uppercase tracking-widest py-3 px-3 hover:bg-white/5 focus:bg-white/5 transition-all cursor-pointer">
                   <Activity className="w-4 h-4 text-white/20" />
                   Dashboard
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}/settings`)} className="rounded-xl gap-3 text-xs font-bold uppercase tracking-widest py-3 px-3 hover:bg-white/5 focus:bg-white/5 transition-all cursor-pointer">
                   <Settings className="w-4 h-4 text-white/20" />
                   Settings
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem onClick={onToggleStatus} className="rounded-xl gap-3 text-xs font-bold uppercase tracking-widest py-3 px-3 hover:bg-white/5 focus:bg-white/5 transition-all cursor-pointer text-white/60">
                   {isOnline ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-500/40" />
                        Pause Project
                      </>
                   ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-500/40" />
                        Resume Project
                      </>
                   )}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                 <DropdownMenuItem 
                    className="rounded-xl gap-3 text-xs font-bold uppercase tracking-widest py-3 px-3 text-red-400 group focus:bg-red-500/10 transition-all cursor-pointer"
                    onClick={onDelete}
                 >
                   <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                   Delete Project
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* High-density metrics row */}
        <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-white/5">
           <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
             <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mb-1">Latency</p>
             <div className="flex items-center gap-2">
               <Zap className="w-3 h-3 text-amber-500/20" />
               <span className="text-[10px] font-bold tabular-nums text-white/40">1.2s</span>
             </div>
           </div>
           <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
             <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mb-1">Memory</p>
             <div className="flex items-center gap-2">
               <HardDrive className="w-3 h-3 text-indigo-500/20" />
               <span className="text-[10px] font-bold tabular-nums text-white/40">256MB</span>
             </div>
           </div>
           <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
             <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mb-1">Status</p>
             <div className="flex items-center gap-2">
               <CheckCircle2 className="w-3 h-3 text-emerald-500/20" />
               <span className="text-[10px] font-bold tabular-nums text-white/40">99.9%</span>
             </div>
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
           <div className="flex items-center gap-3">
             <GitBranch className="w-3.5 h-3.5 text-white/10 group-hover:text-white/30 transition-colors" />
             <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{project.autoDeployBranch || 'main'}</span>
           </div>
           <div className="flex items-center gap-2 text-white/10">
             <RefreshCw className={cn("w-3 h-3", project.status === 'active' && "animate-spin-slow")} />
             <span className="text-[9px] font-bold uppercase tracking-widest">
               {project.lastDeployedAt ? formatTimeAgo(new Date(project.lastDeployedAt)) : 'never deployed'}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
})
ProjectCard.displayName = "ProjectCard"
