'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Package,
  Terminal,
  Clock,
  Key,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Save
} from 'lucide-react'

interface Repository {
  id: number
  owner: string
  repo: string
  fullName: string
  isPrimary: boolean
  branch?: string
}

interface AIAnalysis {
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

interface DeploymentPlan {
  repository: Repository
  analysis: AIAnalysis
  projectName: string
  projectSlug: string
  selectedPorts: number[]
  environmentVariables: Record<string, string>
}

interface StepAIAnalysisProps {
  repository: Repository
  onAnalysisComplete: (analysis: AIAnalysis) => void
  onBack: () => void
  onNext: (plan: DeploymentPlan) => void
}

export function StepAIAnalysis({ repository, onAnalysisComplete, onBack, onNext }: StepAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Editable fields
  const [projectName, setProjectName] = useState(repository.repo)
  const [projectSlug, setProjectSlug] = useState(repository.repo.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
  const [selectedPorts, setSelectedPorts] = useState<number[]>([])
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [isEditingPorts, setIsEditingPorts] = useState(false)
  const [newPort, setNewPort] = useState('')

  useEffect(() => {
    performAIAnalysis()
  }, [repository])

  const performAIAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Simulate AI analysis - replace with actual tRPC call
      await new Promise(resolve => setTimeout(resolve, 3000))

      const mockAnalysis: AIAnalysis = {
        framework: 'Next.js 14',
        detectedPorts: [3000],
        detectedTools: ['Node.js', 'npm', 'TypeScript', 'React'],
        suggestedBuildCommand: 'npm run build',
        suggestedOutputDirectory: '.next',
        suggestedInstallCommand: 'npm install',
        suggestedDevCommand: 'npm run dev',
        summary: `Detected a Next.js 14 application using the App Router pattern. 
                  The project uses TypeScript and React 18 with server components. 
                  Recommended deployment strategy: Static export with serverless functions for API routes.`,
        confidence: 0.95,
        estimatedBuildTime: 120,
        requiresEnvironmentVariables: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
      }

      setAnalysis(mockAnalysis)
      setSelectedPorts(mockAnalysis.detectedPorts)
      
      // Initialize env vars
      const initialEnvVars: Record<string, string> = {}
      mockAnalysis.requiresEnvironmentVariables.forEach(key => {
        initialEnvVars[key] = ''
      })
      setEnvVars(initialEnvVars)
      
      onAnalysisComplete(mockAnalysis)
    } catch (err) {
      console.error('AI Analysis failed:', err)
      setError('Failed to analyze repository. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddPort = () => {
    const port = parseInt(newPort)
    if (port && port > 0 && port < 65536 && !selectedPorts.includes(port)) {
      setSelectedPorts([...selectedPorts, port])
      setNewPort('')
    }
  }

  const handleRemovePort = (port: number) => {
    setSelectedPorts(selectedPorts.filter(p => p !== port))
  }

  const handleEnvVarChange = (key: string, value: string) => {
    setEnvVars({ ...envVars, [key]: value })
  }

  const handleAcceptPlan = () => {
    if (!analysis) return

    const plan: DeploymentPlan = {
      repository,
      analysis,
      projectName,
      projectSlug,
      selectedPorts,
      environmentVariables: envVars,
    }

    onNext(plan)
  }

  if (isAnalyzing) {
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
          Detecting framework, runtime, ports, build tools, and dependencies
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

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={performAIAnalysis}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="h-6 w-6 text-green-400" />
          <h2 className="text-xl md:text-2xl font-semibold">Analysis Complete</h2>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
            {(analysis.confidence * 100).toFixed(0)}% confident
          </span>
        </div>
        <p className="text-sm md:text-base text-gray-400">
          Review the detected configuration and make any necessary adjustments before deploying.
        </p>
      </div>

      {/* Analysis Summary */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-400" />
          AI Summary
        </h3>
        <p className="text-sm text-gray-300">{analysis.summary}</p>
      </div>

      {/* Framework & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 glass-card border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold">Framework</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">{analysis.framework}</p>
        </div>

        <div className="p-4 glass-card border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold">Estimated Build Time</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">{analysis.estimatedBuildTime}s</p>
        </div>
      </div>

      {/* Tools */}
      <div className="p-4 glass-card border border-white/10 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold">Detected Tools</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.detectedTools.map(tool => (
            <span
              key={tool}
              className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Ports Configuration */}
      <div className="p-4 glass-card border border-white/10 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold">Ports</h3>
          </div>
          <button
            onClick={() => setIsEditingPorts(!isEditingPorts)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            {isEditingPorts ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            {isEditingPorts ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedPorts.map(port => (
            <div
              key={port}
              className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full border border-orange-500/30 flex items-center gap-2"
            >
              {port}
              {isEditingPorts && (
                <button
                  onClick={() => handleRemovePort(port)}
                  className="hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {isEditingPorts && (
          <div className="flex gap-2">
            <input
              type="number"
              value={newPort}
              onChange={(e) => setNewPort(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPort()}
              placeholder="Add port (e.g., 8080)"
              className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-sm"
            />
            <button
              onClick={handleAddPort}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Environment Variables */}
      {analysis.requiresEnvironmentVariables.length > 0 && (
        <div className="p-4 glass-card border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold">Environment Variables</h3>
            <span className="text-xs text-gray-400">(Optional - can be set later)</span>
          </div>
          <div className="space-y-3">
            {analysis.requiresEnvironmentVariables.map(key => (
              <div key={key} className="flex flex-col sm:flex-row gap-2">
                <label className="flex-shrink-0 font-mono text-sm text-gray-400 sm:w-48 flex items-center">
                  {key}
                </label>
                <input
                  type="text"
                  value={envVars[key] || ''}
                  onChange={(e) => handleEnvVarChange(key, e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-sm font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build Commands */}
      <div className="p-4 glass-card border border-white/10 rounded-lg">
        <h3 className="font-semibold mb-3">Build Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Install Command</label>
            <code className="block px-3 py-2 bg-black/20 border border-white/10 rounded text-sm font-mono">
              {analysis.suggestedInstallCommand}
            </code>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Build Command</label>
            <code className="block px-3 py-2 bg-black/20 border border-white/10 rounded text-sm font-mono">
              {analysis.suggestedBuildCommand}
            </code>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Dev Command</label>
            <code className="block px-3 py-2 bg-black/20 border border-white/10 rounded text-sm font-mono">
              {analysis.suggestedDevCommand}
            </code>
          </div>
        </div>
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
          onClick={handleAcceptPlan}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          Accept & Deploy
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
