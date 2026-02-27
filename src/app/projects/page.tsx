"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
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
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
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
    <AppShell 
      title={
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-black tracking-[0.4em] uppercase text-foreground/90">Infrastructure_Nodes_Registry</span>
            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              Global_Cluster_Manifest_v2.4.0
            </span>
          </div>
        </div>
      }
      actions={
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/10 group-focus-within:text-indigo-500/40 transition-all duration-700" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="PROBE_NODES..." 
              className="pl-11 w-64 bg-white/[0.02] border border-white/5 focus:border-indigo-500/30 transition-all duration-700 rounded-xl h-10 text-[9px] font-black uppercase tracking-[0.2em] outline-none px-4 text-foreground/60 placeholder:text-muted-foreground/10"
            />
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-black hover:bg-zinc-200 rounded-xl h-10 px-6 text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus className="w-4 h-4" />
            Manifest_Node
          </Button>
        </div>
      }
    >
      <div className="flex-1 p-8 lg:p-12 max-w-[1800px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-1000">
        <ToastContainer />

        {/* Operational Summary Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-6">Registry_Density</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">{projects.length}</span>
              <span className="text-[11px] font-black text-muted-foreground/10 uppercase tracking-[0.2em]">Active_Nodes</span>
            </div>
            <div className="mt-8 flex items-center gap-2">
               <div className="w-full h-1.5 bg-white/[0.02] rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-indigo-500/40 w-[70%] shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
               </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none" />
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-6">Operational_State</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-emerald-400 tabular-nums tracking-tighter shadow-[0_0_20px_rgba(52,211,153,0.1)]">{activeProjectsCount}</span>
              <span className="text-[11px] font-black text-muted-foreground/10 uppercase tracking-[0.2em]">Live_Nodes</span>
            </div>
            <div className="flex items-center gap-3 mt-8 text-[10px] font-black text-emerald-500/30 uppercase tracking-[0.2em]">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Realtime_Uplink_Active
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-6">Discovery_Nodes</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">12</span>
              <span className="text-[11px] font-black text-muted-foreground/10 uppercase tracking-[0.2em]">Cloud_Edges</span>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/10 mt-8 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/5" /> AWS // GCP // AZURE
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none" />
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] mb-6">Interface_Integrity</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-indigo-400 tabular-nums tracking-tighter shadow-[0_0_20px_rgba(99,102,241,0.1)]">99.9</span>
              <span className="text-[11px] font-black text-muted-foreground/10 uppercase tracking-[0.2em]">%_SLA_Uptime</span>
            </div>
            <div className="flex items-center gap-3 mt-8 text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em]">
              <CheckCircle2 className="w-4 h-4" />
              Protocol_Compliant
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="py-64 border border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center bg-[#050505] animate-in zoom-in duration-1000 relative overflow-hidden shadow-3xl ring-1 ring-inset ring-white/[0.01]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.01),transparent_70%)] pointer-events-none" />
            <div className="w-32 h-32 rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 flex items-center justify-center mb-12 shadow-3xl ring-1 ring-inset ring-white/[0.02]">
              <RefreshCw className="w-12 h-12 text-muted-foreground/5" />
            </div>
            <h2 className="text-[16px] font-black uppercase tracking-[0.6em] text-muted-foreground/20 mb-4">REGISTRY_VOID_DETECTED</h2>
            <p className="text-[11px] font-black text-muted-foreground/10 uppercase tracking-[0.3em] mb-16 max-w-sm text-center leading-relaxed px-10">
              Zero sovereign infrastructure nodes have been initialized in this global manifest registry instance.
            </p>
            <Button 
               onClick={() => setIsCreateModalOpen(true)}
               variant="outline"
               className="h-16 px-14 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] transition-all shadow-xl active:scale-95"
            >
              <Plus className="w-5 h-5 mr-4" />
              Manifest_First_Node
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
