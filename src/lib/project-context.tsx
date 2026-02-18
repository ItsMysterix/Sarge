"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  framework?: string;
  repositoryId?: number;
  rootDirectory: string;
  
  // Build settings
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  devCommand: string;
  
  // Deployment settings
  autoDeploy: boolean;
  autoDeployBranch: string;
  previewDeployments: boolean;
  
  // AI analysis
  aiDetectedFramework?: string;
  aiDetectedPorts?: number[];
  aiDetectedTools?: string[];
  aiAnalysisSummary?: string;
  aiAnalyzedAt?: string;
  
  // Status
  status: 'active' | 'paused' | 'archived' | 'pending';
  lastDeployedAt?: string;
  deploymentCount: number;
  
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  selectProjectById: (projectId: string) => void;
  selectProjectBySlug: (slug: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'sarge_current_project_id';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data, isLoading: isQueryLoading, refetch } = trpc.project.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync projects state with tRPC data and restore/set default project
  useEffect(() => {
    if (!isQueryLoading) {
      const projectsList = data?.projects || [];
      setProjects(projectsList);
      
      if (projectsList.length > 0 && !currentProject) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const restored = savedId ? projectsList.find(p => p.id === savedId) : null;
        
        if (restored) {
          setCurrentProjectState(restored);
        } else {
          // Default to first project if none restored
          setCurrentProjectState(projectsList[0]);
          localStorage.setItem(STORAGE_KEY, projectsList[0].id);
        }
      }
      
      setIsLoading(false);
    }
  }, [data, isQueryLoading, currentProject]);

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectProjectById = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const selectProjectBySlug = (slug: string) => {
    const project = projects.find(p => p.slug === slug);
    if (project) {
      setCurrentProject(project);
    }
  };

  const refreshProjects = async () => {
    await refetch();
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        isLoading,
        refreshProjects,
        selectProjectById,
        selectProjectBySlug,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Helper hook to require a project to be selected
export function useRequireProject() {
  const { currentProject, isLoading } = useProject();
  
  if (!isLoading && !currentProject) {
    throw new Error('No project selected. Please select a project to continue.');
  }
  
  return { project: currentProject, isLoading };
}
