"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, GitBranch, Github, RefreshCw, Box, ArrowUpRight, MoreVertical, Settings, Play, Pause, Trash2, ExternalLink, X } from 'lucide-react';
import { GridLoader } from '@/components/ui/grid-loader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast: toast, ToastContainer } = useToast();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  // Use tRPC for data fetching
  const { data, isLoading, refetch } = trpc.project.list.useQuery();
  
  const createMutation = trpc.project.create.useMutation({
    onSuccess: (result) => {
      toast({ type: "success", title: "Project created", description: "Your new project is ready." });
      setShowCreateModal(false);
      setName('');
      refetch();
      if (result?.slug) {
        router.push(`/projects/${result.slug}`);
      }
    },
    onError: (error: any) => {
      toast({ type: "error", title: "Error", description: error.message });
    }
  });

  const updateMutation = trpc.project.update.useMutation({
    onSuccess: () => {
      toast({ type: "success", title: "Project updated" });
      refetch();
    },
    onError: (error: any) => {
      toast({ type: "error", title: "Update failed", description: error.message });
    }
  });

  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
       toast({ type: "success", title: "Project deleted", description: "The project has been permanently removed." });
       setProjectToDelete(null);
       refetch();
    },
    onError: (error: any) => {
       toast({ type: "error", title: "Delete failed", description: error.message });
    }
  });

  const projects = data?.projects || [];
  const hasProjects = projects.length > 0;

  const filteredProjects = projects.filter((project: any) => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.slug?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      autoDeploy: true,
      repositoryId: undefined,
    });
  };

  const handleStatusToggle = (project: any) => {
    const newStatus = project.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({
      id: project.id,
      status: newStatus
    });
  };

  const handleDeleteClick = (project: any) => {
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate({ id: projectToDelete.id });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Projects" subtitle="Restoring your workspace..." />
      </AppShell>
    );
  }

  if (!hasProjects) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in min-h-[calc(100vh-4rem)]">
          <ToastContainer />
          
          <div className="w-full max-w-lg relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 mb-6 shadow-sm">
                  <Box className="w-7 h-7 text-foreground/80" />
               </div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                 Create your first project
               </h1>
               <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
                 Projects organize your services, deployments, and cloud infrastructure.
               </p>
            </div>

            {/* Compact Form Card */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden group">
               <div className="space-y-6 relative">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] ml-1">
                        Project Name
                     </Label>
                     <div className="relative group/input">
                        <Input 
                           value={name} 
                           onChange={(e) => setName(e.target.value)}
                           placeholder="e.g. helios-api" 
                           autoFocus
                           className="h-12 bg-background/50 border-border focus:border-foreground/30 focus:ring-0 rounded-xl transition-all font-mono text-sm px-4"
                        />
                     </div>
                  </div>

                  <Button 
                     size="lg"
                     onClick={handleCreate} 
                     disabled={createMutation.isPending || !name.trim()}
                     className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                  >
                     {createMutation.isPending ? (
                        <GridLoader size="sm" className="mr-2" />
                     ) : (
                        <Plus className="w-4 h-4 mr-2" />
                     )}
                     Initialize Project
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Projects">
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        <ToastContainer />
        
        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
          <div className="relative flex-1 w-full max-w-md group">
            <div className="relative bg-muted/20 rounded-xl border border-border focus-within:border-foreground/20 transition-all">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30 text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={() => refetch()} className="h-11 px-4 border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest rounded-xl">
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none h-11 px-6 bg-foreground text-background hover:bg-foreground/90 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-muted/30">
                <Box className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold mb-1 text-foreground">No matching projects</h3>
                <p className="text-xs text-muted-foreground font-medium">Try adjusting your search query</p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-foreground font-bold text-xs uppercase tracking-widest hover:text-foreground/80">
                  Clear search
                </Button>
              </div>
            </div>
          ) : (
            filteredProjects.map((project: any) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                router={router} 
                onToggleStatus={() => handleStatusToggle(project)}
                onDelete={() => handleDeleteClick(project)}
              />
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          name={name}
          setName={setName}
          isPending={createMutation.isPending}
        />
      )}

      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight">Delete Project</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm font-medium">
              Are you sure you want to delete <strong className="text-foreground">{projectToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setProjectToDelete(null)} className="h-9 hover:bg-muted text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-widest">
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={confirmDelete} 
              disabled={deleteMutation.isPending}
              className="h-9 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-[10px] tracking-widest"
            >
              {deleteMutation.isPending ? (
                 <GridLoader size="sm" className="mr-2" />
              ) : (
                 <Trash2 className="w-3.5 h-3.5 mr-2" />
              )}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function CreateProjectModal({ onClose, onSubmit, name, setName, isPending }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Create Project</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Configure your new workspace.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="modal-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project Name</Label>
            <Input 
              id="modal-name" 
              value={name} 
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="My Awesome App" 
              className="mt-2 bg-muted/50 border-border focus:border-foreground/50 font-medium"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-medium bg-muted/30 p-2 rounded border border-border">
            A unique slug and workspace identifier will be generated automatically.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-muted text-[10px] font-bold uppercase tracking-widest">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-foreground text-background hover:bg-foreground/90 text-[10px] font-bold uppercase tracking-widest px-6">
              {isPending && <GridLoader size="sm" className="mr-2" />}
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ProjectCard = React.memo(({ project, router, onToggleStatus, onDelete }: { project: any, router: any, onToggleStatus: () => void, onDelete: () => void }) => {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      className="group relative flex flex-col justify-between h-[200px] p-6 rounded-2xl border border-border bg-card hover:bg-muted/30 hover:border-foreground/20 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm gpu-accelerate"
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

      <div className="absolute top-0 right-0 p-6 flex items-center text-[10px] font-bold uppercase tracking-widest text-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
         <div className="flex items-center gap-1 bg-background/80 backdrop-blur border border-border px-3 py-1.5 rounded-full shadow-sm">
            View <ArrowUpRight className="w-3 h-3" />
         </div>
      </div>
    </div>
  );
})

function formatTimeAgo(date: Date) {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
