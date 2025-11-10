"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FolderGit2, 
  Clock,
  Loader2,
  Github,
  Folder
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectWizard } from '@/components/projects/project-wizard';
import { trpc } from '@/lib/trpc';

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const t = trpc as any
  const workspacesQuery = t.sarge.oneclick.workspaces.list.useQuery()

  const filteredWorkspaces = (workspacesQuery.data || []).filter((workspace: any) => {
    const matchesSearch = 
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workspace.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleWorkspaceClick = (workspace: any) => {
    // Navigate to workspace detail or deployment page
    router.push(`/workspaces/${workspace.id}`);
  };

  const handleCreateWorkspace = () => {
    setShowWizard(true)
  };

  const handleWizardComplete = () => {
    setShowWizard(false)
    // Refetch workspaces
    workspacesQuery.refetch()
  };

  if (workspacesQuery.isLoading) {
    return (
      <AppShell showSidebar={false}>
        <div className="flex flex-1 p-8 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading workspaces...</p>
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
            <h1 className="text-3xl font-bold mb-2">Workspaces</h1>
            <p className="text-gray-400">Manage your local and cloned repositories</p>
          </div>
          <motion.button
            onClick={handleCreateWorkspace}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap hover:bg-accent/90 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            <Plus className="h-5 w-5" />
            Add Workspace
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 glass-card border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-white placeholder-gray-400"
          />
        </div>

        {/* Workspaces Grid */}
        {filteredWorkspaces.length === 0 && (workspacesQuery.data || []).length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FolderGit2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
            <p className="text-gray-400 mb-6">
              Clone a repository from GitHub or register a local folder to get started
            </p>
            <motion.button
              onClick={handleCreateWorkspace}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors inline-flex items-center gap-2 hover:bg-accent/90"
            >
              <Plus className="h-5 w-5" />
              Add Your First Workspace
            </motion.button>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No workspaces found</h3>
            <p className="text-gray-400">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace: any, index: number) => (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleWorkspaceClick(workspace)}
                className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/50 transition-all cursor-pointer group"
              >
                {/* Workspace Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      {workspace.repoUrl ? (
                        <Github className="h-6 w-6 text-accent" />
                      ) : (
                        <Folder className="h-6 w-6 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-accent transition-colors">
                        {workspace.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate font-mono">
                        {workspace.repoUrl || workspace.path}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workspace Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FolderGit2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{workspace.path}</span>
                  </div>
                  {workspace.branch && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Branch: {workspace.branch}</span>
                    </div>
                  )}
                  {workspace.lastPulled && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Last updated: {new Date(workspace.lastPulled).toLocaleDateString()}</span>
                    </div>
                  )}
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
