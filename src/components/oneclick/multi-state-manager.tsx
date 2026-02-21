'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Square, 
  Trash2, 
  Plus,
  ExternalLink,
  Activity,
  Copy,
  CheckCircle2
} from 'lucide-react'

interface ServiceState {
  id: string
  serviceName: string
  port: number
  label: string              // "Idea A", "Version 2", etc.
  branch?: string            // Git branch
  status: 'running' | 'stopped' | 'building' | 'error'
  url: string
  startedAt?: Date
  metrics?: {
    requests: number
    avgResponseTime: number
    errors: number
  }
}

interface MultiStateManagerProps {
  serviceName: string
  defaultPort: number
  onDeploy: (port: number, label: string, branch?: string) => Promise<void>
  onStop: (stateId: string) => Promise<void>
  onRemove: (stateId: string) => Promise<void>
}

export function MultiStateManager({ 
  serviceName, 
  defaultPort,
  onDeploy,
  onStop,
  onRemove
}: MultiStateManagerProps) {
  const [states, setStates] = useState<ServiceState[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newPort, setNewPort] = useState(defaultPort)
  const [newLabel, setNewLabel] = useState('')
  const [newBranch, setNewBranch] = useState('')

  const handleAddState = async () => {
    if (!newLabel || !newPort) return

    const newState: ServiceState = {
      id: `${serviceName}-${newPort}-${Date.now()}`,
      serviceName,
      port: newPort,
      label: newLabel,
      branch: newBranch || undefined,
      status: 'building',
      url: `http://localhost:${newPort}`,
    }

    setStates(states.concat(newState))
    setIsAddingNew(false)
    setNewLabel('')
    setNewBranch('')
    setNewPort(defaultPort + states.length + 1)

    try {
      await onDeploy(newPort, newLabel, newBranch || undefined)
      setStates(prev => prev.map(s => 
        s.id === newState.id ? { ...s, status: 'running', startedAt: new Date() } : s
      ))
    } catch (error) {
      setStates(prev => prev.map(s => 
        s.id === newState.id ? { ...s, status: 'error' } : s
      ))
    }
  }

  const handleStop = async (stateId: string) => {
    setStates(prev => prev.map(s => 
      s.id === stateId ? { ...s, status: 'stopped' } : s
    ))
    await onStop(stateId)
  }

  const handleRemove = async (stateId: string) => {
    await onRemove(stateId)
    setStates(prev => prev.filter(s => s.id !== stateId))
  }

  const getStatusColor = (status: ServiceState['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'stopped': return 'bg-gray-500'
      case 'building': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
    }
  }

  const getStatusText = (status: ServiceState['status']) => {
    switch (status) {
      case 'running': return 'Running'
      case 'stopped': return 'Stopped'
      case 'building': return 'Building...'
      case 'error': return 'Error'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{serviceName} States</h3>
          <p className="text-sm text-gray-400">
            Deploy multiple versions on different ports to compare
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New State
        </button>
      </div>

      {/* New State Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border border-blue-500/30 bg-blue-500/10 rounded-lg space-y-3"
          >
            <h4 className="font-semibold">Create New State</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Idea A, Version 2, etc."
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Port</label>
                <input
                  type="number"
                  value={newPort}
                  onChange={(e) => setNewPort(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Branch (optional)</label>
                <input
                  type="text"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="main, feature/new-ui"
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddState}
                disabled={!newLabel || !newPort}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deploy
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active States */}
      <div className="space-y-3">
        {states.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No states deployed yet</p>
            <p className="text-sm mt-1">Create your first state to start comparing</p>
          </div>
        ) : (
          <AnimatePresence>
            {states.map((state) => (
              <motion.div
                key={state.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 border border-white/10 rounded-lg bg-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(state.status)}`} />
                    <div>
                      <h4 className="font-semibold">{state.label}</h4>
                      <p className="text-sm text-gray-400">
                        Port {state.port}
                        {state.branch && ` • ${state.branch}`}
                        {state.startedAt && ` • Started ${state.startedAt.toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{getStatusText(state.status)}</span>
                    {state.status === 'running' && (
                      <>
                        <a
                          href={state.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Open in browser"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleStop(state.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Stop"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {state.status === 'stopped' && (
                      <button
                        onClick={() => onDeploy(state.port, state.label, state.branch)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-green-400"
                        title="Start"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(state.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics (when available) */}
                {state.metrics && state.status === 'running' && (
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Requests</p>
                      <p className="text-lg font-semibold">{state.metrics.requests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Avg Response</p>
                      <p className="text-lg font-semibold">{state.metrics.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Errors</p>
                      <p className="text-lg font-semibold text-red-400">{state.metrics.errors}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Comparison Tip */}
      {states.filter(s => s.status === 'running').length >= 2 && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-400">Ready to Compare</h4>
              <p className="text-sm text-gray-300 mt-1">
                You have multiple states running. Test them out and keep the winner!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
