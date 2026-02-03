"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FolderGit2, 
  Clock,
  Settings,
  MoreVertical,
  ExternalLink,
  GitBranch,
  Github,
  Terminal as TerminalIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageTitle } from '@/components/layout/page-title';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast: toast, ToastContainer } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Use tRPC for data fetching
  const { data, isLoading, refetch } = trpc.project.list.useQuery();
  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      toast({ type: "success", title: "Project created", description: "Your new project is ready." });
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ type: "error", title: "Error", description: error.message });
    }
  });

  const projects = data?.projects || [];

  const filteredProjects = projects.filter((project: any) => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.slug?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppShell>
      <main className="flex-1 p-6 w-full max-w-[100vw]">
        <ToastContainer />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <PageTitle
            title="Projects"
            description="Manage your applications and repositories"
            icon={<FolderGit2 className="w-8 h-8 text-primary" />}
          />
          <CreateProjectDialog 
            open={isCreateOpen} 
            onOpenChange={setIsCreateOpen} 
            createMutation={createMutation}
          />
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh projects">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <ProjectSkeleton key={i} />
               ))
            ) : filteredProjects.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                 className="col-span-full"
               >
                 <EmptyState onCreate={() => setIsCreateOpen(true)} isSearching={searchQuery.length > 0} />
               </motion.div>
            ) : (
              filteredProjects.map((project: any) => (
                <ProjectCard key={project.id} project={project} router={router} />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </AppShell>
  );
}

function CreateProjectDialog({ open, onOpenChange, createMutation }: { open: boolean, onOpenChange: (open: boolean) => void, createMutation: any }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      slug,
      framework: 'nextjs', // Default or detect
      autoDeploy: true,
      repositoryId: null, // Allow manual creation without repo
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Connect a repository or create a new project container.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="My Awesome App" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input 
              id="slug" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-awesome-app" 
              className="font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ project, router }: { project: any, router: any }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-card/60 transition-all cursor-pointer min-h-[220px] flex flex-col"
        onClick={() => router.push(`/projects/${project.slug}`)}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary/100 transition-all duration-300" />
        
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              {project.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs text-muted-foreground/80 flex items-center gap-1">
              <TerminalIcon className="w-3 h-3" />
              {project.slug}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.slug}/settings`) }}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className={`
              ${project.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 
                project.status === 'paused' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 
                'border-zinc-500/30 text-zinc-400'}
            `}>
              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${project.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-zinc-400'}`} />
              {project.status.toUpperCase()}
            </Badge>
            {project.framework && (
              <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground font-mono text-xs">
                {project.framework}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span className="truncate">{project.autoDeployBranch || 'main'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(project.updatedAt || project.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-border/20 bg-background/20 mt-auto">
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
             <div className="flex items-center gap-1.5">
               <Github className="w-3.5 h-3.5" />
               <span className="truncate max-w-[120px]">
                 {project.repositoryId ? project.repositoryId : 'Local Project'}
               </span>
             </div>
             {project.lastDeployedAt && (
               <span className="text-xs opacity-70">
                 Deployed {formatTimeAgo(new Date(project.lastDeployedAt))}
               </span>
             )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function ProjectSkeleton() {
  return (
    <Card className="border-border/40 bg-card/20 h-[220px]">
      <CardHeader className="pb-2">
        <div className="h-6 w-1/3 bg-muted/20 animate-pulse rounded mb-2" />
        <div className="h-4 w-1/4 bg-muted/10 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-20 bg-muted/20 animate-pulse rounded-full" />
          <div className="h-5 w-16 bg-muted/20 animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 w-full bg-muted/10 animate-pulse rounded" />
          <div className="h-4 w-full bg-muted/10 animate-pulse rounded" />
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border/10 mt-auto">
        <div className="h-4 w-full bg-muted/10 animate-pulse rounded" />
      </CardFooter>
    </Card>
  )
}

function EmptyState({ onCreate, isSearching }: { onCreate: () => void, isSearching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border/50 bg-card/10">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <FolderGit2 className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {isSearching ? "No matching projects" : "No projects yet"}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {isSearching 
          ? "Try adjusting your search terms or filters."
          : "Create your first project to start deploying and managing your applications."}
      </p>
      <Button onClick={onCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="w-4 h-4 mr-2" />
        {isSearching ? "Create New Project" : "Create Your First Project"}
      </Button>
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
