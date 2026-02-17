'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Loader2, CheckCircle2, XCircle, Terminal, ArrowLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc'

import { DeploymentPlan } from '@/lib/types'

interface StepDeployProps {
  plan: DeploymentPlan
  onBack: () => void
  onDeploymentComplete: (projectId: string) => void
}

export function StepDeploy({ plan, onBack, onDeploymentComplete }: StepDeployProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const deploymentSteps = [
    'Creating project',
    'Cloning repository',
    'Installing dependencies',
    'Building application',
    'Starting services',
    'Deployment complete',
  ]

  const deployMutation = (trpc as any).oneclick.deployConnected.useMutation()
  
  // Real logs streaming
  (trpc as any).oneclick.streamConnected.useSubscription(
    { owner: plan.repository.owner, repo: plan.repository.repo },
    {
      onData: (log: any) => {
        setDeploymentLogs(prev => [...prev.slice(-100), log.line])
        if (log.level === 'error') setError(log.line)
      },
    }
  )

  const handleDeploy = async () => {
    setIsDeploying(true)
    setError(null)
    setDeploymentLogs([])

    try {
      // 1. Get access token
      setDeploymentLogs(prev => [...prev, '🔑 Fetching GitHub credentials...'])
      const tokenRes = await fetch('/api/github/access-token')
      if (!tokenRes.ok) throw new Error('Failed to fetch GitHub token')
      const { token } = await tokenRes.json()

      // 2. Start deployment
      setDeploymentLogs(prev => [...prev, `🚀 Initiating ${plan.provider} deployment for ${plan.repository.full_name}...`])
      
      const result = await deployMutation.mutateAsync({
        owner: plan.repository.owner,
        repo: plan.repository.repo,
        branch: plan.repository.branch || 'main',
        accessToken: token,
        provider: plan.provider,
        environment: plan.environment,
        deploymentMethod: plan.provider === 'local' ? 'local' : 'docker'
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setDeploymentLogs(prev => [...prev, '✅ Deployment handshake successful'])
      
      // The subscription will handle the rest of the logs
      // We'll wait a bit or wait for a specific log to signal completion
      // For now, let's wait 5 seconds and signal success if no error
      setTimeout(() => {
        if (!error) onDeploymentComplete(result.deploymentId || crypto.randomUUID())
      }, 5000)

    } catch (err: any) {
      console.error('Deployment failed:', err)
      setError(err.message || 'Deployment failed. Please try again.')
      setDeploymentLogs(prev => [...prev, `✗ Error: ${err.message}`])
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Deploy to Localhost</h2>
        <p className="text-sm md:text-base text-gray-400">
          Deploy {plan.projectName} to your local environment with live monitoring.
        </p>
      </div>

      {!isDeploying && deploymentLogs.length === 0 ? (
        <div className="text-center py-12">
          <Rocket className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Deploy</h3>
          <p className="text-gray-400 mb-6">
            Click the button below to start deploying your application to localhost.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={handleDeploy}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Start Deployment
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="p-6 glass-card border border-white/10 rounded-lg">
            <div className="space-y-4">
              {deploymentSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : index === currentStep ? (
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
                  )}
                  <span className={index <= currentStep ? 'text-white' : 'text-gray-400'}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Logs Terminal */}
          <div className="p-4 bg-black/40 border border-white/10 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="text-gray-400">Deployment Logs</span>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {deploymentLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-green-400"
                >
                  {log}
                </motion.div>
              ))}
              {isDeploying && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-gray-400"
                >
                  ▊
                </motion.div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400">Deployment Error</h4>
                <p className="text-sm text-gray-400 mt-1">{error}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
