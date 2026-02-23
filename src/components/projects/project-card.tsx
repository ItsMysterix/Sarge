import React from 'react'
import { Box, GitBranch, RefreshCw, MoreVertical, ExternalLink, Settings, Pause, Play, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatTimeAgo(date: Date) {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const ProjectCard = React.memo(({ project, router, onToggleStatus, onDelete }: { project: any, router: any, onToggleStatus: () => void, onDelete: () => void }) => {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      className="group relative flex flex-col justify-between h-auto p-6 rounded-2xl border border-border bg-card hover:bg-muted/30 hover:border-foreground/20 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm gpu-accelerate"
      onClick={() => router.push(`/projects/${project.slug}`)}
    >
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm">
               {project.framework === 'nextjs' ? (
                 <svg viewBox="0 0 180 180" width="20" height="20" className="text-background fill-current">
                   <mask height="180" id="mask0_408_134" maskUnits="userSpaceOnUse" width="180" x="0" y="0"><circle cx="90" cy="90" fill="black" r="90"></circle></mask><g mask="url(#mask0_408_134)"><circle cx="90" cy="90" data-circle="true" fill="black" r="90"></circle><path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.095C143.333 162.014 146.509 159.818 149.508 157.52Z" fill="white"></path><rect fill="white" height="72" width="12" x="115" y="54"></rect></g>
                 </svg>
               ) : (
                 <Box className="w-6 h-6" />
               )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-none tracking-tight text-foreground transition-colors mb-1.5">
                {project.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded border border-border">{project.slug}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
             {project.status && (
               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest ${
                 isOnline 
                   ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' 
                   : 'border-muted-foreground/20 bg-muted/10 text-muted-foreground'
               }`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                 {project.status}
               </div>
             )}

             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="h-8 w-8 flex items-center justify-center p-0 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                   <MoreVertical className="w-4 h-4" />
                   <span className="sr-only">Open menu</span>
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                 <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}`)}>
                   <ExternalLink className="w-4 h-4 mr-2" />
                   Open Dashboard
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}/settings`)}>
                   <Settings className="w-4 h-4 mr-2" />
                   Settings
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={onToggleStatus}>
                   {isOnline ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Project
                      </>
                   ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume Project
                      </>
                   )}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem 
                    className="text-foreground focus:text-foreground focus:bg-muted"
                    onClick={onDelete}
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete Project
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
        
        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium border-t border-border/50 pt-4">
             <div className="flex items-center gap-2">
               <GitBranch className="w-3.5 h-3.5 opacity-50" />
               <span className="font-mono">{project.autoDeployBranch || 'main'}</span>
             </div>
             <div className="flex items-center gap-2">
               <RefreshCw className="w-3.5 h-3.5 opacity-50" />
               <span>
                 {project.lastDeployedAt ? formatTimeAgo(new Date(project.lastDeployedAt)) : 'Never deployed'}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
})
ProjectCard.displayName = "ProjectCard"
