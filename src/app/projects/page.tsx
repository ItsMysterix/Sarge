"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectModal } from "@/components/projects/create-project-modal"

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [search, setSearch] = useState(query);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const { addToast, ToastContainer } = useToast();

  const utils = trpc.useContext();
  const { data, isLoading } = trpc.project.list.useQuery();
  
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      addToast({ title: 'Success', description: 'Project created successfully', type: 'success' });
      setIsCreateModalOpen(false);
      setNewProjectName('');
      utils.project.list.invalidate();
    },
    onError: (err) => {
      addToast({ title: 'Error', description: err.message, type: 'error' });
    }
  });

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
    }
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      addToast({ title: 'Success', description: 'Project deleted', type: 'success' });
      utils.project.list.invalidate();
    }
  });

  if (isLoading) return <LoadingScreen />;

  const projects = data?.projects || [];
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createProject.mutate({ name: newProjectName });
  };

  const handleToggleStatus = (project: any) => {
    updateProject.mutate({
      id: project.id,
      status: project.status === 'active' ? 'paused' : 'active'
    });
  };

  const handleDelete = (id: string) => {
     if (confirm('Are you sure you want to delete this project?')) {
       deleteProject.mutate({ id });
     }
  };

  return (
    <AppShell title="Projects">
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        <ToastContainer />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Projects</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage your cloud infrastructure across multiple environments.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..." 
                className="pl-10 w-64 bg-muted/30 border border-border focus:border-foreground/30 transition-all rounded-xl h-11 text-sm outline-none px-4"
              />
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-3xl bg-muted/5 animate-scale-in">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <RefreshCw className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">No projects found</h2>
            <p className="text-muted-foreground mb-8 max-w-sm text-center">Get started by creating your first project to orchestrate your infrastructure.</p>
            <Button 
               onClick={() => setIsCreateModalOpen(true)}
               className="bg-foreground text-background"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                router={router}
                onToggleStatus={() => handleToggleStatus(project)}
                onDelete={() => handleDelete(project.id)}
              />
            ))}
          </div>
        )}

        {isCreateModalOpen && (
          <CreateProjectModal 
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateProject}
            name={newProjectName}
            setName={setNewProjectName}
            isPending={createProject.isLoading}
          />
        )}
      </div>
    </AppShell>
  );
}
