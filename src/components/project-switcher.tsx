"use client";

import React, { useState } from 'react';
import { useProject, type Project } from '@/lib/project-context';
import { ChevronDown, Plus, Search, Check, FolderGit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Framework icons mapping
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

export function ProjectSwitcher() {
  const { currentProject, projects, setCurrentProject, isLoading } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
    setSearchQuery('');
    // Refresh current page to load project-specific data
    router.refresh();
  };

  const handleCreateProject = () => {
    setIsOpen(false);
    router.push('/projects/new');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <button
        onClick={handleCreateProject}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
      >
        <Plus className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-accent">Create Project</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card hover:bg-accent/10 transition-colors min-w-[200px] group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0 w-6 h-6 rounded bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {currentProject?.framework && frameworkIcons[currentProject.framework.toLowerCase()] 
              ? frameworkIcons[currentProject.framework.toLowerCase()]
              : <FolderGit2 className="h-3 w-3" />
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-foreground truncate">
              {currentProject?.name || 'Select Project'}
            </div>
            {currentProject && (
              <div className="text-xs text-muted-foreground truncate">
                {currentProject.slug}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-[320px] rounded-lg bg-popover border border-border shadow-2xl z-[60] overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    autoFocus
                  />
                </div>
              </div>

              {/* Projects List */}
              <div className="max-h-[400px] overflow-y-auto">
                {filteredProjects.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No projects found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent/10 transition-colors ${
                          currentProject?.id === project.id ? 'bg-accent/20' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-accent to-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {project.framework && frameworkIcons[project.framework.toLowerCase()] 
                            ? frameworkIcons[project.framework.toLowerCase()]
                            : <FolderGit2 className="h-4 w-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {project.framework || 'Unknown'} • {project.status}
                          </div>
                        </div>
                        {currentProject?.id === project.id && (
                          <Check className="h-4 w-4 text-accent flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Project */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={handleCreateProject}
                  className="w-full px-4 py-2.5 flex items-center gap-3 rounded-lg hover:bg-accent/10 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Plus className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-accent">
                      Create New Project
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Deploy a new application
                    </div>
                  </div>
                </button>
              </div>

              {/* Project Count */}
              <div className="px-4 py-2 bg-muted border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
