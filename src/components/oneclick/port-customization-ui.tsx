'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Server, 
  Edit2, 
  Check, 
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react'

interface ServiceConfig {
  name: string
  type: 'web' | 'api' | 'worker' | 'database' | 'cache' | 'queue'
  framework?: string
  defaultPort: number
  workingDirectory: string
}

interface PortMapping {
  serviceName: string
  port: number
  label: string
  branch?: string
}

interface PortCustomizationUIProps {
  services: ServiceConfig[]
  onConfirm: (portMappings: PortMapping[]) => void
  onBack: () => void
}

export function PortCustomizationUI({ services, onConfirm, onBack }: PortCustomizationUIProps) {
  // Initialize with default single deployment per service
  const [portMappings, setPortMappings] = useState<PortMapping[]>(
    services.map(service => ({
      serviceName: service.name,
      port: service.defaultPort,
      label: 'Production',
      branch: 'main'
    }))
  )
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [portConflicts, setPortConflicts] = useState<number[]>([])

  // Check for port conflicts
  const checkConflicts = (mappings: PortMapping[]) => {
    const portCounts = new Map<number, number>()
    mappings.forEach(m => {
      portCounts.set(m.port, (portCounts.get(m.port) || 0) + 1)
    })
    const conflicts = Array.from(portCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([port, _]) => port)
    setPortConflicts(conflicts)
  }

  const addNewMapping = (serviceName: string, basePort: number) => {
    const serviceCount = portMappings.filter(m => m.serviceName === serviceName).length
    const newMapping: PortMapping = {
      serviceName,
      port: basePort + serviceCount,
      label: `Version ${serviceCount + 1}`,
      branch: ''
    }
    const updated = [...portMappings, newMapping]
    setPortMappings(updated)
    checkConflicts(updated)
  }

  const updateMapping = (index: number, updates: Partial<PortMapping>) => {
    const updated = portMappings.map((m, i) => 
      i === index ? { ...m, ...updates } : m
    )
    setPortMappings(updated)
    checkConflicts(updated)
    setEditingIndex(null)
  }

  const removeMapping = (index: number) => {
    const updated = portMappings.filter((_, i) => i !== index)
    setPortMappings(updated)
    checkConflicts(updated)
  }

  const getServiceInfo = (serviceName: string) => 
    services.find(s => s.name === serviceName)

  const hasConflicts = portConflicts.length > 0
  const groupedMappings = services.map(service => ({
    service,
    mappings: portMappings.filter(m => m.serviceName === service.name)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Configure Deployment Ports</h2>
        <p className="text-gray-400">
          Set up multiple deployments on different ports to test different ideas or versions.
          You can always add more states later.
        </p>
      </div>

      {/* Port Conflict Warning */}
      {hasConflicts && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-400">Port Conflicts Detected</h4>
              <p className="text-sm text-gray-300 mt-1">
                Ports {portConflicts.join(', ')} are used multiple times. Each deployment needs a unique port.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Services with Port Mappings */}
      <div className="space-y-6">
        {groupedMappings.map(({ service, mappings }) => (
          <div key={service.name} className="border border-white/10 rounded-lg overflow-hidden">
            {/* Service Header */}
            <div className="p-4 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <p className="text-sm text-gray-400">
                    {service.framework || service.type} • {service.workingDirectory}
                  </p>
                </div>
                <button
                  onClick={() => addNewMapping(service.name, service.defaultPort)}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add State
                </button>
              </div>
            </div>

            {/* Port Mappings */}
            <div className="divide-y divide-white/10">
              {mappings.map((mapping, idx) => {
                const globalIndex = portMappings.indexOf(mapping)
                const isEditing = editingIndex === globalIndex
                const hasConflict = portConflicts.includes(mapping.port)

                return (
                  <div
                    key={globalIndex}
                    className={`p-4 ${hasConflict ? 'bg-red-500/5' : ''}`}
                  >
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Label</label>
                            <input
                              type="text"
                              defaultValue={mapping.label}
                              placeholder="Production, Idea A, etc."
                              onBlur={(e) => updateMapping(globalIndex, { label: e.target.value })}
                              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-sm"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Port</label>
                            <input
                              type="number"
                              defaultValue={mapping.port}
                              min="1024"
                              max="65535"
                              onBlur={(e) => updateMapping(globalIndex, { port: parseInt(e.target.value) })}
                              className={`w-full px-3 py-2 bg-black/20 border rounded-lg focus:outline-none focus:ring-2 text-white text-sm ${
                                hasConflict ? 'border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:ring-blue-500/50'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Branch (optional)</label>
                            <input
                              type="text"
                              defaultValue={mapping.branch}
                              placeholder="main, feature/new-ui"
                              onBlur={(e) => updateMapping(globalIndex, { branch: e.target.value })}
                              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded text-sm flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg font-mono text-lg font-semibold ${
                            hasConflict 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            :{mapping.port}
                          </div>
                          <div>
                            <h4 className="font-semibold">{mapping.label}</h4>
                            <p className="text-sm text-gray-400">
                              {mapping.branch || 'No branch specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingIndex(globalIndex)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {mappings.length > 1 && (
                            <button
                              onClick={() => removeMapping(globalIndex)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-blue-400 mb-1">Pro Tip: Multi-State Testing</p>
            <p>
              Deploy multiple versions of the same service to compare different implementations, 
              UI designs, or performance optimizations. Keep the winner, kill the rest!
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="font-semibold mb-2">Deployment Summary</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• <strong>{services.length}</strong> services detected</p>
          <p>• <strong>{portMappings.length}</strong> total deployments</p>
          <p>• Ports: {portMappings.map(m => m.port).join(', ')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(portMappings)}
          disabled={hasConflicts}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {hasConflicts ? (
            <>
              <X className="h-5 w-5" />
              Fix Port Conflicts
            </>
          ) : (
            <>
              <Server className="h-5 w-5" />
              Deploy All ({portMappings.length})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
