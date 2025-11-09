'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StepSelectRepo } from '@/components/oneclick/step-select-repo'
import { StepAIAnalysis } from '@/components/oneclick/step-ai-analysis'
import { StepDeploy } from '@/components/oneclick/step-deploy'
import { StepMonitor } from '@/components/oneclick/step-monitor'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type Step = 'select' | 'analyze' | 'deploy' | 'monitor'

export interface Repository {
  id: number
  owner: string
  repo: string
  fullName: string
  isPrimary: boolean
  branch?: string
}

export interface AIAnalysis {
  framework: string
  detectedPorts: number[]
  detectedTools: string[]
  suggestedBuildCommand: string
  suggestedOutputDirectory: string
  suggestedInstallCommand: string
  suggestedDevCommand: string
  summary: string
  confidence: number
  estimatedBuildTime: number
  requiresEnvironmentVariables: string[]
}

export interface DeploymentPlan {
  repository: Repository
  analysis: AIAnalysis
  projectName: string
  projectSlug: string
  selectedPorts: number[]
  environmentVariables: Record<string, string>
}

export default function OneClickDeployPage() {
  const [step, setStep] = useState<Step>('select')
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null)
  const [deploymentPlan, setDeploymentPlan] = useState<DeploymentPlan | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  // Responsive design hooks
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  const steps = [
    { id: 'select', label: 'Select Repo', icon: '📦' },
    { id: 'analyze', label: 'AI Analysis', icon: '🤖' },
    { id: 'deploy', label: 'Deploy', icon: '🚀' },
    { id: 'monitor', label: 'Monitor', icon: '📊' },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  const handleRepoSelected = (repo: Repository) => {
    setSelectedRepo(repo)
    setStep('analyze')
  }

  const handleAnalysisComplete = (analysis: AIAnalysis) => {
    setAIAnalysis(analysis)
  }

  const handleAnalysisAccepted = (plan: DeploymentPlan) => {
    setDeploymentPlan(plan)
    setStep('deploy')
  }

  const handleDeploymentComplete = (id: string) => {
    setProjectId(id)
    setStep('monitor')
  }

  const handleStartOver = () => {
    setStep('select')
    setSelectedRepo(null)
    setAIAnalysis(null)
    setDeploymentPlan(null)
    setProjectId(null)
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className={`mx-auto ${isDesktop ? 'max-w-6xl' : isTablet ? 'max-w-4xl' : 'max-w-full'}`}>
            {/* Header */}
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                One-Click Deploy with AI
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-400">
                Select a repository, let AI analyze it, review the deployment plan, and deploy to localhost with live metrics.
              </p>
            </header>

            {/* Stepper */}
            <nav className="mb-6 md:mb-8" aria-label="Progress">
              {isMobile ? (
                // Mobile: Compact stepper
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-400">
                    Step {currentStepIndex + 1} of {steps.length}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {steps[currentStepIndex].icon} {steps[currentStepIndex].label}
                  </div>
                </div>
              ) : (
                // Desktop/Tablet: Full stepper
                <div className="flex items-center gap-2 md:gap-4">
                  {steps.map((s, idx) => {
                    const isActive = step === s.id
                    const isDone = idx < currentStepIndex
                    return (
                      <div key={s.id} className="flex flex-1 items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 text-sm md:text-base font-semibold transition ${
                              isActive
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : isDone
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-gray-600 text-gray-400'
                            }`}
                          >
                            {isDone ? '✓' : s.icon}
                          </div>
                          {!isMobile && (
                            <span
                              className={`text-xs md:text-sm font-medium ${
                                isActive ? 'text-white' : isDone ? 'text-blue-400' : 'text-gray-400'
                              }`}
                            >
                              {s.label}
                            </span>
                          )}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`mx-1 md:mx-2 h-0.5 flex-1 ${
                              isDone ? 'bg-blue-500' : 'bg-gray-600'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </nav>

            {/* Progress bar */}
            <div className="mb-6 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step content */}
            <div className="glass-card p-4 md:p-6 lg:p-8 border border-white/10 rounded-lg">
              {step === 'select' && (
                <StepSelectRepo onRepoSelected={handleRepoSelected} />
              )}
              
              {step === 'analyze' && selectedRepo && (
                <StepAIAnalysis
                  repository={selectedRepo}
                  onAnalysisComplete={handleAnalysisComplete}
                  onBack={() => setStep('select')}
                  onNext={handleAnalysisAccepted}
                />
              )}

              {step === 'deploy' && deploymentPlan && (
                <StepDeploy
                  plan={deploymentPlan}
                  onBack={() => setStep('analyze')}
                  onDeploymentComplete={handleDeploymentComplete}
                />
              )}

              {step === 'monitor' && projectId && (
                <StepMonitor
                  projectId={projectId}
                  onStartOver={handleStartOver}
                />
              )}
            </div>

            {/* Helper text for responsive */}
            {isMobile && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-400">
                  💡 Tip: For the best experience, rotate to landscape or use a larger screen.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
