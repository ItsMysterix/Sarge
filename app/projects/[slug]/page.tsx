"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  FolderGit2,
  Settings,
  Rocket,
  GitBranch,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        // Fetch all projects and find the one with matching slug
        const response = await fetch('/api/projects');
        const data = await response.json();
        const foundProject = data.projects.find((p: any) => p.slug === slug);
        
        if (foundProject) {
          setProject(foundProject);
        } else {
          console.error('Project not found:', slug);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const copyProjectId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-1 p-8 items-center justify-center">
          <div className="text-center">
            <div className="glass-card p-8 rounded-lg border border-white/10 inline-block">
              <FolderGit2 className="h-12 w-12 text-accent mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 mb-4">Loading project...</p>
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

  if (!project) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto p-8">
          <div className="glass-card p-12 text-center border border-white/10 rounded-lg">
            <FolderGit2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Project not found</h3>
            <p className="text-gray-400 mb-6">
              The project "{slug}" doesn't exist or you don't have access to it.
            </p>
            <motion.button
              onClick={() => router.push('/projects')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-accent text-black rounded-lg font-medium transition-colors inline-flex items-center gap-2 hover:bg-accent/90"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Projects
            </motion.button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center">
                <FolderGit2 className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <p className="text-gray-400 font-mono text-sm">{project.slug}</p>
              </div>
            </div>
            <motion.button
              onClick={() => router.push(`/projects/${slug}/settings`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 border border-white/10 text-white rounded-lg font-medium transition-colors flex items-center gap-2 hover:bg-white/5"
            >
              <Settings className="h-5 w-5" />
              Settings
            </motion.button>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 border border-white/10 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Project ID</h3>
            <button
              onClick={copyProjectId}
              className="flex items-center gap-2 text-sm hover:text-accent transition-colors group w-full"
            >
              <span className="font-mono text-left flex-1 truncate">{project.id}</span>
              {copiedId ? (
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
              ) : (
                <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </button>
          </div>

          <div className="glass-card p-6 border border-white/10 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white capitalize">{project.status || 'Active'}</span>
            </div>
          </div>

          <div className="glass-card p-6 border border-white/10 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Created</h3>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-white">
                {new Date(project.createdAt || project.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="glass-card p-6 border border-white/10 rounded-lg mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-white">{project.description}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-6 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border border-white/10 rounded-lg hover:border-accent/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium">Deploy Project</h4>
                  <p className="text-xs text-gray-400">Create a new deployment</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border border-white/10 rounded-lg hover:border-accent/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Connect Repository</h4>
                  <p className="text-xs text-gray-400">Link to GitHub repo</p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-8 glass-card p-8 border border-white/10 rounded-lg text-center">
          <p className="text-gray-400">
            More project details and deployment history coming soon...
          </p>
        </div>
      </div>
    </AppShell>
  );
}
