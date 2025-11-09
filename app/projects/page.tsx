"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/lib/project-context';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderGit2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Settings,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

const frameworkIcons: Record<string, string> = {
  'next.js': '▲',
  'react': '⚛️',
  'vue': 'V',
  'svelte': 'S',
  'angular': 'A',
  'node': '◆',
  'python': '🐍',
  'go': 'Go',
  'rust': '🦀',
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, setCurrentProject, refreshProjects } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    refreshProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleProjectClick = (project: any) => {
    setCurrentProject(project);
    router.push('/');
  };

  const handleCreateProject = () => {
    router.push('/oneclick');
  };

  const handleProjectSettings = (e: React.MouseEvent, projectSlug: string) => {
    e.stopPropagation();
    router.push(`/projects/${projectSlug}/settings`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      {/* Minimal Header matching workspace style (title only, badge lives in global header) */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-gray-400 text-sm">Select a project to enter the command center.</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 glass-card border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-11 pr-8 py-3 glass-card border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Create Project Button */}
        <button
          onClick={handleCreateProject}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          {projects.length === 0 ? (
            <>
              <FolderGit2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">
                Get started by creating your first project with one-click deploy
              </p>
              <button
                onClick={handleCreateProject}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Project
              </button>
            </>
          ) : (
            <>
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-gray-400">
                Try adjusting your search or filters
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleProjectClick(project)}
              className="glass-card p-6 border border-white/10 rounded-lg hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold">
                    {project.framework && frameworkIcons[project.framework.toLowerCase()]
                      ? frameworkIcons[project.framework.toLowerCase()]
                      : <FolderGit2 className="h-6 w-6" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {project.slug}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleProjectSettings(e, project.slug)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Settings className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-white/5 rounded">
                  <div className="text-lg font-bold text-white">
                    {project.deploymentCount}
                  </div>
                  <div className="text-xs text-gray-400">Deploys</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded">
                  <div className="text-lg font-bold text-green-400">
                    <CheckCircle2 className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="text-xs text-gray-400">Active</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded">
                  <div className="text-lg font-bold text-blue-400">
                    {project.framework || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Framework</div>
                </div>
              </div>

              {/* Last Deployment */}
              {project.lastDeployedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last deployed {new Date(project.lastDeployedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
                  {project.status}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Compact Stats Footer */}
      {projects.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-8 text-sm">
          <div className="flex flex-col">
            <span className="font-medium">{projects.length}</span>
            <span className="text-gray-400">Projects</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-green-400">{projects.filter(p => p.status === 'active').length}</span>
            <span className="text-gray-400">Active</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-blue-400">{projects.reduce((sum, p) => sum + p.deploymentCount, 0)}</span>
            <span className="text-gray-400">Deploys</span>
          </div>
        </div>
      )}
    </div>
  );
}
