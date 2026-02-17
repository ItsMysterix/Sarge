'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { PortCustomizationUI } from './port-customization-ui'

interface Repository {
  id: number
  owner: string
  repo: string
  fullName: string
  isPrimary: boolean
  branch?: string
}

interface ServiceConfig {
  name: string
  type: 'web' | 'api' | 'worker' | 'database' | 'cache' | 'queue'
  framework?: string
  defaultPort: number
  workingDirectory: string
  buildCommand?: string
  startCommand: string
  environmentVariables: string[]
}

interface AIAnalysisResult {
  projectType: string
  services: ServiceConfig[]
  infrastructure: any[]
  needsDocker: boolean
  dockerComposeYml?: string | null
  dockerfiles: Record<string, string>
  recommendedPlatform: string
  deploymentStrategy: string
  confidence: number
  summary: string
}

interface PortMapping {
  serviceName: string
  port: number
  label: string
  branch?: string
}

interface StepAIAnalysisWithPortsProps {
  repository: Repository
  onBack: () => void
  onComplete: (analysis: AIAnalysisResult, portMappings: PortMapping[]) => void
}

export function StepAIAnalysisWithPorts({ 
  repository, 
  onBack, 
  onComplete 
}: StepAIAnalysisWithPortsProps) {
  const [step, setStep] = useState<'analyzing' | 'review' | 'ports'>('analyzing')
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeMutation = (trpc.project as any).analyzeRepository.useMutation()

  useEffect(() => {
    performAnalysis()
  }, [repository])

  const performAnalysis = async () => {
    setStep('analyzing')
    setError(null)

    try {
      console.log(`Starting AI analysis for ${repository.owner}/${repository.repo}`)
      
      const result = await analyzeMutation.mutateAsync({
        repositoryId: repository.id,
        owner: repository.owner,
        repo: repository.repo,
        branch: repository.branch || 'main',
      })

      console.log('AI analysis complete:', result)
      setAnalysis(result)
      setStep('review')
    } catch (err) {
      console.error('AI Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze repository')
      setStep('review')
    }
  }

  const handleContinueToPortConfig = () => {
    setStep('ports')
  }

  const handlePortsConfirmed = (portMappings: PortMapping[]) => {
    if (analysis) {
      onComplete(analysis, portMappings)
    }
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Brain className="h-16 w-16 text-blue-400" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">AI is analyzing your repository...</h3>
        <p className="text-gray-400 text-center max-w-md">
          Detecting services, frameworks, ports, infrastructure requirements, and generating Docker configurations
        </p>
        <div className="mt-8 w-full max-w-md">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'review' && analysis) {
    return (
      <div className="space-y-6">
        {/* Analysis Header */}
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-400" />
          <h2 className="text-xl md:text-2xl font-semibold">Analysis Complete</h2>
          <span className={`px-3 py-1 text-sm rounded-full border ${
            analysis.confidence > 0.8 
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : analysis.confidence > 0.6
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
          }`}>
            {(analysis.confidence * 100).toFixed(0)}% confident
          </span>
        </div>

        {/* Project Type & Platform */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 glass-card border border-white/10 rounded-lg">
            <h3 className="text-sm text-gray-400 mb-1">Project Type</h3>
            <p className="text-xl font-semibold capitalize">{analysis.projectType}</p>
          </div>
          <div className="p-4 glass-card border border-white/10 rounded-lg">
            <h3 className="text-sm text-gray-400 mb-1">Recommended Platform</h3>
            <p className="text-xl font-semibold capitalize">{analysis.recommendedPlatform}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            AI Summary
          </h3>
          <p className="text-sm text-gray-300">{analysis.summary}</p>
        </div>

        {/* Detected Services */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Detected Services ({analysis.services.length})
          </h3>
          <div className="space-y-2">
            {analysis.services.map((service, idx) => (
              <div
                key={idx}
                className="p-4 border border-white/10 rounded-lg bg-white/5 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold">{service.name}</h4>
                  <p className="text-sm text-gray-400">
                    {service.framework || service.type} • {service.workingDirectory}
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg font-mono font-semibold">
                  :{service.defaultPort}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        {analysis.infrastructure.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Infrastructure ({analysis.infrastructure.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.infrastructure.map((infra: any, idx: number) => (
                <div key={idx} className="p-3 border border-white/10 rounded-lg bg-white/5">
                  <div className="font-semibold">{infra.service}</div>
                  <div className="text-sm text-gray-400">{infra.purpose}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deployment Strategy */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h3 className="font-semibold mb-2">Deployment Strategy</h3>
          <p className="text-sm text-gray-300">{analysis.deploymentStrategy}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={handleContinueToPortConfig}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors"
          >
            Continue to Port Configuration →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'ports' && analysis) {
    return (
      <PortCustomizationUI
        services={analysis.services}
        onConfirm={handlePortsConfirmed}
        onBack={() => setStep('review')}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  return null
}
