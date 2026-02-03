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
  const [slug, setSlug] = useState('');

  // Use tRPC for data fetching
  const { data, isLoading, refetch } = trpc.project.list.useQuery();
  const createMutation = trpc.project.create.useMutation({
    onSuccess: (result) => {
      toast({ type: "success", title: "Project created", description: "Your new project is ready." });
      setShowCreateModal(false);
      setName('');
      setSlug('');
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
      slug,
      framework: 'nextjs', 
      autoDeploy: true,
      repositoryId: undefined,
    });
  };

  // Onboarding view - no projects yet
  if (!isLoading && !hasProjects) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <ToastContainer />
          <div className="max-w-md w-full text-center">
            {/* Welcome illustration */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
              <Rocket className="w-10 h-10 text-violet-400" />
            </div>
            
            <h1 className="text-2xl font-semibold mb-2">Welcome to Sarge</h1>
            <p className="text-muted-foreground mb-8">
              Create your first project to get started with deployments, environments, and more.
            </p>

            {/* Create form inline */}
            <form onSubmit={handleCreate} className="glass-card p-6 text-left space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-muted-foreground">Project Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="My Awesome App" 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-sm text-muted-foreground">Slug</Label>
                <Input 
                  id="slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-awesome-app" 
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !name.trim()}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Project
              </Button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 w-full max-w-7xl mx-auto">
        <ToastContainer />
        
        {/* Header - Single Create Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and deploy your applications.</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background focus:ring-1 focus:ring-zinc-700 hover:border-zinc-700 transition-colors"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
             Array.from({ length: 9 }).map((_, i) => (
               <ProjectSkeleton key={i} />
             ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Box className="w-10 h-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No matching projects</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Project</h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="modal-name" className="text-sm text-muted-foreground">Project Name</Label>
                <Input 
                  id="modal-name" 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="My Awesome App" 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="modal-slug" className="text-sm text-muted-foreground">Slug</Label>
                <Input 
                  id="modal-slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-awesome-app" 
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ProjectCard({ project, router }: { project: any, router: any }) {
  const isOnline = project.status === 'active';
  
  return (
    <div 
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group flex flex-col justify-between h-[180px] p-5 rounded-lg border border-border bg-card hover:border-zinc-500/50 transition-all cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               {project.framework === 'nextjs' ? <div className="w-4 h-4 rounded-full bg-black dark:bg-white" /> : <Box className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none tracking-tight group-hover:underline decoration-zinc-500/50 underline-offset-4 decoration-1">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{project.slug}</p>
            </div>
          </div>
          {project.status && (
            <Badge variant="outline" className={`h-5 text-[10px] px-1.5 uppercase border rounded-full ${isOnline ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-zinc-500'}`}>
              {project.status}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1.5 mt-4">
          <div className="flex items-center text-xs text-muted-foreground">
             <GitBranch className="w-3 h-3 mr-2 opacity-70" />
             <span className="font-mono">{project.autoDeployBranch || 'main'}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
             <RefreshCw className="w-3 h-3 mr-2 opacity-70" />
             <span>
               {project.lastDeployedAt ? formatTimeAgo(new Date(project.lastDeployedAt)) : 'Never deployed'}
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-border/50">
        <div className="flex-1 flex gap-2">
          {project.repositoryId && (
            <a href={`https://github.com/${project.repositoryId}`} onClick={e => e.stopPropagation()} target="_blank" className="text-xs flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-3.5 h-3.5 mr-1.5" />
              GitHub
            </a>
          )}
        </div>
        <button className="text-xs font-medium flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1 rounded transition-colors -mr-2">
           Visit <Globe className="w-3 h-3 ml-1.5 opacity-70" />
        </button>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="h-[180px] p-5 rounded-lg border border-border bg-card/50">
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-zinc-800/50 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-800/50 rounded animate-pulse" />
          <div className="h-3 w-16 bg-zinc-800/50 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-3 w-32 bg-zinc-800/50 rounded animate-pulse" />
        <div className="h-3 w-24 bg-zinc-800/50 rounded animate-pulse" />
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
