'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Server, 
  Database, 
  Package, 
  FileCode, 
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ServiceConfig {
  name: string
  type: 'web' | 'api' | 'worker' | 'database' | 'cache' | 'queue'
  framework?: string
  defaultPort: number
  buildCommand?: string
  startCommand: string
  workingDirectory: string
  environmentVariables: string[]
  dockerfile?: string
  healthcheck?: string
}

interface InfrastructureRequirement {
  type: 'database' | 'cache' | 'queue' | 'storage' | 'other'
  service: string
  version?: string
  purpose: string
}

interface DeploymentAnalysisProps {
  analysis: {
    projectType: string
    services: ServiceConfig[]
    infrastructure: InfrastructureRequirement[]
    needsDocker: boolean
    dockerComposeYml?: string | null
    dockerfiles: Record<string, string>
    recommendedPlatform: string
    deploymentStrategy: string
    confidence: number
  }
}

export function DeploymentAnalysisView({ analysis }: DeploymentAnalysisProps) {
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = async (text: string, item: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedItem(item)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐'
      case 'api': return '⚡'
      case 'worker': return '⚙️'
      case 'database': return '💾'
      case 'cache': return '⚡'
      case 'queue': return '📬'
      default: return '📦'
    }
  }

  const getInfraIcon = (type: string) => {
    switch (type) {
      case 'database': return '💾'
      case 'cache': return '⚡'
      case 'queue': return '📬'
      case 'storage': return '📁'
      default: return '🔧'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deployment Analysis</h2>
          <p className="text-gray-400 text-sm mt-1">
            {analysis.projectType.charAt(0).toUpperCase() + analysis.projectType.slice(1)} project • 
            {analysis.services.length} service{analysis.services.length !== 1 ? 's' : ''} detected •
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${
          analysis.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
          analysis.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-orange-500/20 text-orange-400'
        }`}>
          {analysis.confidence > 0.8 ? <CheckCircle2 className="inline h-5 w-5 mr-2" /> : <AlertCircle className="inline h-5 w-5 mr-2" />}
          {analysis.confidence > 0.8 ? 'High Confidence' : 
           analysis.confidence > 0.6 ? 'Medium Confidence' : 
           'Low Confidence - Review Required'}
        </div>
      </div>

      {/* Deployment Recommendation */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-400" />
          Recommended Platform: {analysis.recommendedPlatform}
        </h3>
        <p className="text-sm text-gray-300">{analysis.deploymentStrategy}</p>
      </div>

      {/* Services */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Services ({analysis.services.length})</h3>
        {analysis.services.map((service, idx) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="border border-white/10 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between"
              onClick={() => setExpandedService(expandedService === service.name ? null : service.name)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getServiceIcon(service.type)}</span>
                <div>
                  <h4 className="font-semibold">{service.name}</h4>
                  <p className="text-sm text-gray-400">
                    {service.framework || service.type} • Default Port: {service.defaultPort}
                  </p>
                </div>
              </div>
              {expandedService === service.name ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedService === service.name && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Working Directory</label>
                    <code className="block text-sm bg-black/20 px-2 py-1 rounded mt-1">{service.workingDirectory}</code>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Health Check</label>
                    <code className="block text-sm bg-black/20 px-2 py-1 rounded mt-1">{service.healthcheck || 'N/A'}</code>
                  </div>
                </div>

                {service.buildCommand && (
                  <div>
                    <label className="text-xs text-gray-400">Build Command</label>
                    <code className="block text-sm bg-black/20 px-2 py-1 rounded mt-1">{service.buildCommand}</code>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400">Start Command</label>
                  <code className="block text-sm bg-black/20 px-2 py-1 rounded mt-1">{service.startCommand}</code>
                </div>

                {service.environmentVariables.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400">Environment Variables</label>
                    <div className="mt-1 space-y-1">
                      {service.environmentVariables.map(env => (
                        <code key={env} className="block text-sm bg-black/20 px-2 py-1 rounded">{env}</code>
                      ))}
                    </div>
                  </div>
                )}

                {service.dockerfile && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400">Dockerfile</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(service.dockerfile!, `dockerfile-${service.name}`)}
                          className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedItem === `dockerfile-${service.name}` ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => downloadFile(service.dockerfile!, `Dockerfile.${service.name}`)}
                          className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 rounded flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs bg-black/40 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {service.dockerfile}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Infrastructure */}
      {analysis.infrastructure.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Infrastructure Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.infrastructure.map((infra, idx) => (
              <div key={idx} className="p-4 border border-white/10 rounded-lg bg-white/5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getInfraIcon(infra.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{infra.service}</h4>
                      {infra.version && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">{infra.version}</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{infra.purpose}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Docker Compose */}
      {analysis.needsDocker && analysis.dockerComposeYml && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Docker Compose Configuration</h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(analysis.dockerComposeYml!, 'docker-compose')}
                className="text-sm px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copiedItem === 'docker-compose' ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => downloadFile(analysis.dockerComposeYml!, 'docker-compose.yml')}
                className="text-sm px-3 py-2 bg-green-500 hover:bg-green-600 rounded flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
          <pre className="text-sm bg-black/40 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {analysis.dockerComposeYml}
          </pre>
        </div>
      )}
    </div>
  )
}
