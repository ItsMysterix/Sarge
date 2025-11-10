"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FolderGit2, 
  Clock,
  Settings
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWizard } from '@/components/projects/project-wizard';

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      // Filter out mock projects
      const realProjects = (data.projects || []).filter((project: any) => 
        project.slug !== 'my-nextjs-app' && project.name !== 'My Next.js App'
      );
      setProjects(realProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleProjectClick = (project: any) => {
    router.push(`/projects/${project.slug}`);
  };

  const handleCreateProject = () => {
    setShowWizard(true)
  };

  const handleWizardComplete = (project: any) => {
    setShowWizard(false)
    // Navigate to new project
    if (project?.slug) {
      router.push(`/projects/${project.slug}`)
    }
    // Refetch projects
    fetchProjects();
  };

  const handleCreateInline = async () => {
    if (!name.trim() || !slug.trim()) {
      alert('Please provide both project name and slug');
      return;
    }
    
    try {
      setCreating(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: '',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      const project = await response.json();
      
      // Reset form
      setName('');
      setSlug('');
      setShowInlineForm(false);
      
      // Refetch and navigate
      await fetchProjects();
      router.push(`/projects/${project.slug}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell showSidebar={false}>
        <div className="flex flex-1 p-8 items-center justify-center">
          <div className="text-center">
            <div className="glass-card p-8 rounded-lg border border-white/10 inline-block">
              <FolderGit2 className="h-12 w-12 text-accent mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 mb-4">Loading projects...</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSidebar={false}>
      <div className="max-w-7xl mx-auto p-8 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-gray-400">Manage your projects and deployments</p>
          </div>
          <motion.button
            onClick={handleCreateProject}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap hover:bg-accent/90 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            <Plus className="h-5 w-5" />
            Create Project
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 glass-card border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-white placeholder-gray-400"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 && projects.length === 0 ? (
          <div className="glass-card p-8 border border-white/10 rounded-lg">
            {!showInlineForm ? (
              <div className="text-center py-8">
                <FolderGit2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-400 mb-6">
                  Create your first project to get started with deployments
                </p>
                <motion.button
                  onClick={() => setShowInlineForm(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors inline-flex items-center gap-2 hover:bg-accent/90"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Project
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Create New Project</h3>
                  <button
                    onClick={() => {
                      setShowInlineForm(false);
                      setName('');
                      setSlug('');
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      // Auto-generate slug
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }
                    }}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-awesome-project"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-white placeholder-gray-400 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used in URLs: /projects/{slug || 'your-slug'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={handleCreateInline}
                    disabled={creating || !name.trim() || !slug.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        Create Project
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowInlineForm(false);
                      setName('');
                      setSlug('');
                    }}
                    disabled={creating}
                    className="px-6 py-3 border border-white/10 text-gray-300 rounded-lg font-medium transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-gray-400">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any, index: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleProjectClick(project)}
                className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/50 transition-all cursor-pointer group relative"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FolderGit2 className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-accent transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate font-mono">
                        {project.slug}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/projects/${project.slug}/settings`)
                    }}
                    className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                {/* Project Info */}
                <div className="space-y-2 text-sm">
                  {project.description && (
                    <p className="text-gray-400 line-clamp-2">{project.description}</p>
                  )}
                  {project.framework && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs px-2 py-1 bg-white/5 rounded">
                        {project.framework}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">
                      Created {new Date(project.created_at || project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <ProjectWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </AppShell>
  );
}
