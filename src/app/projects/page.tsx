"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/lib/trpc';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Layers, CheckCircle2, Activity, Globe, Shield } from 'lucide-react';
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectModal } from "@/components/projects/create-project-modal"
import { motion, AnimatePresence } from "framer-motion"

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
      title="Projects"
      actions={
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/40 transition-all" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 h-9 pl-10 pr-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/60 placeholder:text-white/10 focus:outline-none focus:border-white/10 transition-all"
            />
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all"
          >
            New Project
          </Button>
        </div>
      }
    >
      <div className="flex-1 p-8 lg:p-12 max-w-[1800px] mx-auto w-full flex flex-col gap-10 animate-in fade-in duration-700">
        <ToastContainer />

        {/* Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group overflow-hidden">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Total Projects</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white tracking-tight tabular-nums">{projects.length}</span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Active nodes</span>
            </div>
            <div className="mt-8 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white/20 w-[60%] transition-all duration-1000" />
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group overflow-hidden">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Live Services</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-emerald-400 tracking-tight tabular-nums">{activeProjectsCount}</span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Running</span>
            </div>
            <div className="flex items-center gap-2 mt-8 text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Real-time monitoring active
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group overflow-hidden">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Managed Resources</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white/80 tracking-tight tabular-nums">12</span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Cloud Edges</span>
            </div>
            <div className="flex items-center gap-2 mt-8 text-[10px] font-bold text-white/10 uppercase tracking-widest">
              <Globe className="w-3.5 h-3.5 opacity-40" />
              AWS / GCP / Azure
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative group overflow-hidden">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">System Health</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white/80 tracking-tight tabular-nums">99.9%</span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">SLA Uptime</span>
            </div>
            <div className="flex items-center gap-2 mt-8 text-[10px] font-bold text-white/20 uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 opacity-40" />
              Security Compliant
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="py-32 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center bg-white/[0.01] animate-in zoom-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 shadow-xl">
              <RefreshCw className="w-8 h-8 text-white/5" />
            </div>
            <h2 className="text-lg font-bold text-white/60 mb-2 uppercase tracking-tight">No projects initialized</h2>
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest mb-10 text-center max-w-sm leading-relaxed">
              Create your first project to start managing infrastructure and deploying applications.
            </p>
            <Button 
               onClick={() => setIsCreateModalOpen(true)}
               className="h-11 px-10 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 mr-3" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={project.id}
              >
                <ProjectCard 
                  project={project}
                  router={router}
                  onToggleStatus={() => handleToggleStatus(project)}
                  onDelete={() => handleDelete(project.id)}
                />
              </motion.div>
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
