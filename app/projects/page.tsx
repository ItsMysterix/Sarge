"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  GitBranch, 
  Github,
  Globe,
  Loader2,
  RefreshCw,
  Box,
  Rocket
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast: toast, ToastContainer } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');

  // Use tRPC for data fetching
  const { data, isLoading, refetch } = trpc.project.list.useQuery();
  const createMutation = trpc.project.create.useMutation({
    onSuccess: (result) => {
      toast({ type: "success", title: "Project created", description: "Your new project is ready." });
      setShowCreateModal(false);
      setName('');
      refetch();
      // Navigate to the new project
      if (result?.slug) {
        router.push(`/projects/${result.slug}`);
      }
    },
    onError: (error: any) => {
      toast({ type: "error", title: "Error", description: error.message });
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

  // Onboarding view - no projects yet
  if (!isLoading && !hasProjects) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8 animate-fade-in min-h-[calc(100vh-4rem)]">
          <ToastContainer />
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
               <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 mb-4">
                 Create Project
               </h1>
               <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                 Your project is a container for all your services, databases, and environments.
               </p>
            </div>

            <div className="glass-card p-1 mt-8 border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/5 pointer-events-none" />
               
               <div className="p-8 md:p-12 space-y-10 relative">
                  {/* Step 1: Name */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <Label className="text-lg font-medium">Project Name</Label>
                        <span className="text-sm text-muted-foreground">e.g. Acme Corp, Production, Internal Tools</span>
                     </div>
                     <div className="relative">
                        <Input 
                           value={name} 
                           onChange={(e) => {
                             setName(e.target.value);
                           }}
                           placeholder="My First Project" 
                           className="h-16 text-2xl px-6 bg-white/[0.03] border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 rounded-xl transition-all"
                        />
                     </div>
                     <p className="text-sm text-muted-foreground">
                        This name will be used to identify your project in the dashboard.
                     </p>
                  </div>

                  {/* Action */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center text-sm text-muted-foreground">
                        <Box className="w-4 h-4 mr-2 text-violet-400" />
                        Environments included
                     </div>
                     <Button 
                        size="lg"
                        onClick={(e) => {
                           e.preventDefault();
                           createMutation.mutate({
                              name,
                              autoDeploy: true,
                              repositoryId: undefined,
                           });
                        }} 
                        disabled={createMutation.isPending || !name.trim()}
                        className="h-12 px-8 bg-white text-black hover:bg-white/90 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                     >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Project
                     </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 w-full max-w-7xl mx-auto animate-fade-in">
        <ToastContainer />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and deploy your applications.</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-black hover:bg-white/90 font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/50 rounded-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-400 transition-colors" />
              <Input
                placeholder="Search projects by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="h-10 border-white/[0.08] hover:bg-white/[0.05] text-muted-foreground hover:text-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {isLoading ? (
             Array.from({ length: 9 }).map((_, i) => (
               <ProjectSkeleton key={i} />
             ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <Box className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No matching projects</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-violet-400 hover:text-violet-300">
                  Clear search
                </Button>
              </div>
            </div>
          ) : (
            filteredProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} router={router} />
            ))
          )}
        </div>
      </div>

        {/* Create Modal */}
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          name={name}
          setName={setName}
          isPending={createMutation.isPending}
        />
      )}
    </AppShell>
  );
}

function CreateProjectModal({ onClose, onSubmit, name, setName, isPending }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Create Project</h3>
            <p className="text-sm text-muted-foreground">Configure your new application.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <div className="sr-only">Close</div>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.50009L3.21846 10.9685C2.99391 11.193 2.99391 11.5571 3.21846 11.7816C3.44301 12.0062 3.80708 12.0062 4.03164 11.7816L7.50005 8.31322L10.9685 11.7816C11.193 12.0062 11.5571 12.0062 11.7816 11.7816C12.0062 11.5571 12.0062 11.193 11.7816 10.9685L8.31322 7.50009L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modal-name" className="text-sm font-medium text-foreground">Project Name</Label>
            <Input 
              id="modal-name" 
              value={name} 
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="My Awesome App" 
              className="mt-1.5 bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            A unique identifier will be generated automatically.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-white text-black hover:bg-white/90">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, router }: { project: any, router: any }) {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group relative flex flex-col justify-between h-[200px] p-6 rounded-xl border border-white/[0.06] bg-black/40 hover:bg-white/[0.02] hover:border-violet-500/30 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform duration-300 shadow-lg">
               {project.framework === 'nextjs' ? (
                 <svg viewBox="0 0 180 180" width="18" height="18" className="text-foreground fill-current">
                   <mask height="180" id="mask0_408_134" maskUnits="userSpaceOnUse" width="180" x="0" y="0"><circle cx="90" cy="90" fill="black" r="90"></circle></mask><g mask="url(#mask0_408_134)"><circle cx="90" cy="90" data-circle="true" fill="black" r="90"></circle><path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.095C143.333 162.014 146.509 159.818 149.508 157.52Z" fill="white"></path><rect fill="white" height="72" width="12" x="115" y="54"></rect></g>
                 </svg>
               ) : (
                 <Box className="w-5 h-5 opacity-70" />
               )}
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none tracking-tight group-hover:text-violet-200 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded">{project.slug}</span>
              </div>
            </div>
          </div>
          {project.status && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${
              isOnline 
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
              {project.status}
            </div>
          )}
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center text-xs text-muted-foreground/80">
             <GitBranch className="w-3.5 h-3.5 mr-2 opacity-50" />
             <span className="font-mono opacity-80">{project.autoDeployBranch || 'main'}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground/80">
             <RefreshCw className="w-3.5 h-3.5 mr-2 opacity-50" />
             <span className="opacity-80">
               {project.lastDeployedAt ? formatTimeAgo(new Date(project.lastDeployedAt)) : 'Never deployed'}
             </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-3 pt-4 border-t border-white/[0.06] mt-auto">
        <div className="flex-1 flex gap-2">
          {project.repositoryId && (
            <a href={`https://github.com/${project.repositoryId}`} onClick={e => e.stopPropagation()} target="_blank" className="text-xs flex items-center text-muted-foreground hover:text-white transition-colors">
              <Github className="w-3.5 h-3.5 mr-1.5" />
              GitHub
            </a>
          )}
        </div>
        <div className="flex items-center text-xs text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
           View Dashboard <Rocket className="w-3 h-3 ml-1.5" />
        </div>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="h-[200px] p-6 rounded-xl border border-white/[0.06] bg-white/[0.01]">
      <div className="flex gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-3 w-40 bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="border-t border-white/5 pt-4 mt-auto">
        <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date) {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
