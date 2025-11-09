"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load current project from localStorage
  useEffect(() => {
    if (projects.length === 0) return;

    const savedProjectId = localStorage.getItem(STORAGE_KEY);
    
    if (savedProjectId) {
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProjectState(savedProject);
        return;
      }
    }

    // Auto-select first project if only one exists
    if (projects.length === 1) {
      setCurrentProjectState(projects[0]);
      localStorage.setItem(STORAGE_KEY, projects[0].id);
    } else if (projects.length > 1) {
      // Select first active project
      const activeProject = projects.find(p => p.status === 'active');
      if (activeProject) {
        setCurrentProjectState(activeProject);
        localStorage.setItem(STORAGE_KEY, activeProject.id);
      }
    }
  }, [projects]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual tRPC call once backend is ready
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        // Fallback: empty projects list
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    await loadProjects();
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
