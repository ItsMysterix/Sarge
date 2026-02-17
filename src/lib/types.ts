export interface Repository {
  id: number;
  name: string;
  owner: string;
  repo: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  branch?: string;
  language?: string;
  stargazers_count?: number;
  updated_at?: string;
}

export interface DetectedService {
  name: string;
  type: string;
  cwd: string;
  startCommand?: string;
  buildCommand?: string;
  ports: number[];
  envKeys: string[];
  framework?: string;
}

export interface AIAnalysis {
  framework: string;
  detectedPorts: number[];
  detectedTools: string[];
  suggestedBuildCommand: string;
  suggestedOutputDirectory: string;
  suggestedInstallCommand: string;
  suggestedDevCommand: string;
  summary: string;
  confidence: number;
  estimatedBuildTime: number;
  requiresEnvironmentVariables: string[];
  services?: DetectedService[];
  externalServices?: DetectedService[];
}

export interface DeploymentPlan {
  repository: Repository;
  analysis: AIAnalysis;
  projectName: string;
  projectSlug: string;
  selectedPorts: number[];
  environmentVariables: Record<string, string>;
  provider: string;
  environment: 'preview' | 'staging' | 'production';
}
