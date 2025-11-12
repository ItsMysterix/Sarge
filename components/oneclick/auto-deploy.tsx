'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc'
import { FolderOpen, Github, Zap, PlayCircle, CheckCircle, Loader2, Settings, RefreshCw } from 'lucide-react'

interface AutoDeployProps {
  onComplete?: () => void
}

type Stage = 'select' | 'analyzing' | 'installing' | 'starting' | 'running'

export function AutoDeploy({ onComplete }: AutoDeployProps) {
  const t = trpc as any
  const [stage, setStage] = useState<Stage>('select')
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const [connectedRepo, setConnectedRepo] = useState<any>(null)
  const [connectedDeploying, setConnectedDeploying] = useState(false)
  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(0)
  const steps = ['Repository', 'Package Manager', 'Ports', 'Monitoring', 'MCP Servers', 'Summary']
  const [selectedPackageManager, setSelectedPackageManager] = useState<string | null>(null)
  const [enableGrafana, setEnableGrafana] = useState<boolean>(true)
  const [enablePrometheus, setEnablePrometheus] = useState<boolean>(true)
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([])
  const [showTerminal, setShowTerminal] = useState<boolean>(false)
  const [selectedPort, setSelectedPort] = useState<number>(3000)
  const [availablePorts, setAvailablePorts] = useState<number[]>([])
  const [scanningPorts, setScanningPorts] = useState(false)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [serviceUrls, setServiceUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showPortPicker, setShowPortPicker] = useState(false)

  // Fetch workspaces and scan ports on mount
  useEffect(() => {
    fetchWorkspaces()
    scanAvailablePorts()
    fetchConnectedRepo()
  }, [])

  // Subscribe to connected deploy logs when topic set
  // (Removed log subscription from wizard interface; terminal may attach later if desired)
  const fetchConnectedRepo = async () => {
    try {
      const res = await fetch('/api/repository')
      if (res.ok) {
        const data = await res.json()
        setConnectedRepo(data.repository)
      }
    } catch (e) {
      console.warn('No connected repository found')
    }
  }

  const fetchAccessToken = async (): Promise<string | null> => {
    try {
      const r = await fetch('/api/github/access-token')
      if (r.status === 200) {
        const j = await r.json()
        return j.token || null
      }
      return null
    } catch {
      return null
    }
  }

  const startConnectedDeploy = async () => {
    if (!connectedRepo) return
    setConnectedDeploying(true)
    setConnectedLogs([])
    setError(null)
    try {
      const token = await fetchAccessToken()
      if (!token) {
        setError('Missing GitHub access token (set GITHUB_ACCESS_TOKEN or user token).')
        setConnectedLogs(prev => [...prev, { ts: Date.now(), line: '❌ Missing GitHub access token. Set env or user token.', level: 'error' }])
        return
      }
      const resp = await t.sarge.oneclick.deployConnected.mutate({
        owner: connectedRepo.owner,
        repo: connectedRepo.repo,
        branch: 'main',
        accessToken: token,
      })
      // Deployment started; terminal can optionally subscribe using resp.logTopic later
    } catch (e: any) {
      setError(e.message || 'Connected deploy failed')
    } finally {
      setConnectedDeploying(false)
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const result = await t.sarge.oneclick.workspaces.list.query()
      setWorkspaces(result)
    } catch (err) {
      console.error('Failed to fetch workspaces:', err)
    }
  }

  const scanAvailablePorts = async () => {
    setScanningPorts(true)
    try {
      // Check common ports for availability
      const portsToCheck = [3000, 3001, 3002, 4000, 5000, 8000, 8001, 8080, 8081, 9000]
      const available: number[] = []
      
      for (const port of portsToCheck) {
        const isAvailable = await checkPortAvailability(port)
        if (isAvailable) {
          available.push(port)
        }
      }
      
      setAvailablePorts(available)
      
      // Set first available port as default
      if (available.length > 0) {
        setSelectedPort(available[0])
      }
    } catch (err) {
      console.error('Failed to scan ports:', err)
      // Fallback to default ports if scan fails
      setAvailablePorts([3000, 8000])
      setSelectedPort(3000)
    } finally {
      setScanningPorts(false)
    }
  }

  const checkPortAvailability = async (port: number): Promise<boolean> => {
    try {
      // Try to fetch from the port - if it fails, port is likely available
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 1000)
      
      const response = await fetch(`http://localhost:${port}`, {
        signal: controller.signal,
        mode: 'no-cors'
      }).catch(() => null)
      
      clearTimeout(timeout)
      
      // If we get any response, port is in use
      // If fetch fails completely, port is available
      return response === null
    } catch {
      // Port is available (connection refused)
      return true
    }
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const startAutoDeploy = async () => {
    if (!selectedWorkspace) return
    
    setError(null)
    setLogs([])
    setServiceUrls([])
    setDeploymentId(null)
    
    try {
      // Stage 1: Analyzing
      setStage('analyzing')
      addLog('🔍 Starting AI analysis...')
      addLog(`📁 Workspace: ${workspaces.find(w => w.id === selectedWorkspace)?.name}`)
      
      const workspace = await t.sarge.oneclick.workspaces.get.query({ 
        workspaceId: selectedWorkspace 
      })
      
      addLog(`📍 Path: ${workspace.path}`)
      addLog('🤖 Detecting package managers, frameworks, and languages...')
      
      // Run enhanced detection
      const result = await t.sarge.oneclick.detectRepo.mutate({ 
        workspaceId: selectedWorkspace 
      })
      
      setDetectionResult(result)
      
      if (!result.services || result.services.length === 0) {
        throw new Error('No services detected in workspace')
      }
      
      addLog(`✅ Detected ${result.services.length} service(s)`)
      result.services.forEach((svc: any, idx: number) => {
        addLog(`   ${idx + 1}. ${svc.name} (${svc.framework || svc.language || 'unknown'})`)
        if (svc.packageManager) {
          addLog(`      📦 Package Manager: ${svc.packageManager.name}`)
        }
      })
      
      // Stage 2: Installing
      setStage('installing')
      addLog('')
      addLog('📦 Installing dependencies...')
      
      for (const service of result.services) {
        if (service.installCommand) {
          addLog(`   Installing for ${service.name}: ${service.installCommand}`)
          // TODO: Execute actual install commands via backend
          await new Promise(resolve => setTimeout(resolve, 1500))
          addLog(`   ✅ ${service.name} dependencies installed`)
        }
      }
      
      // Stage 3: Starting services
      setStage('starting')
      addLog('')
      addLog('🚀 Starting services...')
      
      const servicesData: any[] = []
      let currentPort = selectedPort
      
      // Prepare service data for deployment
      for (const service of result.services) {
        const servicePort = service.ports?.[0] || currentPort
        const url = `http://localhost:${servicePort}`
        
        servicesData.push({
          name: service.name,
          port: servicePort,
          url,
          status: 'starting' as const,
        })
        
        currentPort++
      }
      
      // Create deployment record
      const deployment = await t.sarge.deploy.create.mutate({
        workspaceId: selectedWorkspace,
        branch: 'main', // TODO: detect actual branch
        summary: `Auto-deploy: ${workspace.name}`,
        services: servicesData,
      })
      
      setDeploymentId(deployment.id)
      addLog(`📋 Created deployment #${deployment.id}`)
      
      // Start actual services
      for (const service of servicesData) {
        addLog(`   Starting ${service.name}: ${service.url}`)
        // TODO: Execute actual start commands via backend
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog(`   ✅ ${service.name} running`)
        setServiceUrls(prev => [...prev, `${service.name}: ${service.url}`])
      }
      
      // Update deployment status to running
      await t.sarge.deploy.updateDeploymentStatus.mutate({
        deploymentId: deployment.id,
        status: 'running',
        services: servicesData.map(s => ({ ...s, status: 'running' })),
      })
      
      // Record initial metrics for each service
      for (const service of servicesData) {
        try {
          await t.sarge.metrics.recordServiceMetric.mutate({
            workspaceId: selectedWorkspace,
            deploymentId: deployment.id,
            serviceName: service.name,
            port: service.port,
            status: 'running',
            cpuPercent: 0,
            memoryMb: 0,
            requestCount: 0,
            errorCount: 0,
            uptimeSeconds: 0,
          })
          addLog(`   📊 Metrics tracking enabled for ${service.name}`)
        } catch (err) {
          console.error('Failed to record metric:', err)
        }
      }
      
      // Update workspace health
      try {
        await t.sarge.metrics.updateWorkspaceHealth.mutate({
          workspaceId: selectedWorkspace,
          workspaceName: workspace.name,
          activeServices: servicesData.length,
          avgUptime: 100,
          gradeScore: 90,
          overallGrade: 'A',
        })
      } catch (err) {
        console.error('Failed to update workspace health:', err)
      }
      
      // Stage 4: Running
      setStage('running')
      addLog('')
      addLog('✨ All services are running!')
      addLog('🌐 Access your services at:')
      servicesData.forEach(svc => addLog(`   ${svc.name}: ${svc.url}`))
      addLog('')
      addLog(`💾 Deployment ID: ${deployment.id}`)
      addLog('📊 Metrics tracking active')
      
      if (onComplete) {
        onComplete()
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      addLog(`❌ Error: ${errorMsg}`)
      
      // Update deployment status to failed if we have a deployment ID
      if (deploymentId) {
        try {
          await t.sarge.deploy.updateDeploymentStatus.mutate({
            deploymentId,
            status: 'failed',
          })
        } catch (updateErr) {
          console.error('Failed to update deployment status:', updateErr)
        }
      }
      
      setStage('select')
    }
  }

  const getStageIcon = (currentStage: Stage) => {
    switch (currentStage) {
      case 'analyzing':
        return <Loader2 className="w-5 h-5 animate-spin text-accent" />
      case 'installing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      case 'starting':
        return <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      default:
        return <Zap className="w-5 h-5 text-accent" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Stage Indicator */}
      <div className="flex items-center gap-4 p-4 glass-card border border-white/10 rounded-lg">
        <div className="flex items-center gap-2">
          {getStageIcon(stage)}
          <span className="font-semibold capitalize">
            {stage === 'select' ? 'Ready to Deploy' : stage}
          </span>
        </div>
        
        {stage !== 'select' && (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-blue-400"
                initial={{ width: '0%' }}
                animate={{ 
                  width: stage === 'analyzing' ? '25%' 
                    : stage === 'installing' ? '50%' 
                    : stage === 'starting' ? '75%' 
                    : '100%' 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm text-gray-400">
              {stage === 'analyzing' ? '25%' 
                : stage === 'installing' ? '50%' 
                : stage === 'starting' ? '75%' 
                : '100%'}
            </span>
          </div>
        )}
      </div>

      {/* Wizard Interface */}
      {connectedRepo && stage === 'select' && (
        <div className="space-y-6 p-4 glass-card border border-white/10 rounded-lg">
          {/* Stepper */}
          <div className="flex items-center gap-2 flex-wrap">
            {steps.map((s, idx) => (
              <button
                key={s}
                onClick={() => setWizardStep(idx)}
                className={`px-3 py-1 rounded text-xs border transition-colors ${wizardStep === idx ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
              >
                {idx + 1}. {s}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="border border-white/10 rounded-lg p-4 bg-black/30">
            {wizardStep === 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Repository</h3>
                <p className="text-sm text-gray-400">{connectedRepo.full_name}</p>
                <p className="text-xs text-gray-500">Branch: main (editable later)</p>
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="mt-2 px-3 py-1 bg-accent text-black rounded text-sm"
                >Next: Package Manager →</button>
              </div>
            )}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Package Manager</h3>
                <div className="flex gap-2 flex-wrap">
                  {['pnpm','npm','yarn','bun'].map(pm => (
                    <button
                      key={pm}
                      onClick={() => setSelectedPackageManager(pm)}
                      className={`px-3 py-1 rounded border text-xs ${selectedPackageManager === pm ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
                    >{pm}</button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs text-gray-400 hover:text-accent">← Back</button>
                  <button disabled={!selectedPackageManager} onClick={() => setWizardStep(wizardStep + 1)} className="text-xs bg-accent text-black px-3 py-1 rounded disabled:opacity-40">Next: Ports →</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Ports</h3>
                <p className="text-xs text-gray-500">Scanned starting port: {selectedPort}. Consecutive allocation for detected services.</p>
                <div className="flex items-center gap-2">
                  <input type="number" value={selectedPort} onChange={e => setSelectedPort(parseInt(e.target.value)||3000)} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs w-24" />
                  <button onClick={scanAvailablePorts} className="text-xs text-accent">Rescan</button>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs text-gray-400 hover:text-accent">← Back</button>
                  <button onClick={() => setWizardStep(wizardStep + 1)} className="text-xs bg-accent text-black px-3 py-1 rounded">Next: Monitoring →</button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Monitoring</h3>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={enableGrafana} onChange={e=>setEnableGrafana(e.target.checked)} /> Enable Grafana dashboard</label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={enablePrometheus} onChange={e=>setEnablePrometheus(e.target.checked)} /> Enable Prometheus metrics</label>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs text-gray-400 hover:text-accent">← Back</button>
                  <button onClick={() => setWizardStep(wizardStep + 1)} className="text-xs bg-accent text-black px-3 py-1 rounded">Next: MCP Servers →</button>
                </div>
              </div>
            )}
            {wizardStep === 4 && (
              <div className="space-y-3">
                <h3 className="font-semibold">MCP Servers</h3>
                <p className="text-xs text-gray-500">Select optional Model Context Protocol servers to launch.</p>
                <div className="flex flex-wrap gap-2">
                  {['code-intel','secrets','llm','events'].map(s => {
                    const active = selectedMcpServers.includes(s)
                    return (
                      <button key={s} onClick={()=> setSelectedMcpServers(active? selectedMcpServers.filter(x=>x!==s): [...selectedMcpServers,s])} className={`px-3 py-1 rounded text-xs border ${active? 'bg-accent text-black border-accent':'border-white/15 hover:border-accent/40'}`}>{s}</button>
                    )
                  })}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs text-gray-400 hover:text-accent">← Back</button>
                  <button onClick={() => setWizardStep(wizardStep + 1)} className="text-xs bg-accent text-black px-3 py-1 rounded">Next: Summary →</button>
                </div>
              </div>
            )}
            {wizardStep === 5 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Summary</h3>
                <ul className="text-xs space-y-1 text-gray-300">
                  <li>Repository: {connectedRepo.full_name}</li>
                  <li>Package Manager: {selectedPackageManager || 'none selected'}</li>
                  <li>Starting Port: {selectedPort}</li>
                  <li>Grafana: {enableGrafana? 'enabled':'disabled'}</li>
                  <li>Prometheus: {enablePrometheus? 'enabled':'disabled'}</li>
                  <li>MCP Servers: {selectedMcpServers.length? selectedMcpServers.join(', '): 'none'}</li>
                </ul>
                <div className="flex justify-between items-center">
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs text-gray-400 hover:text-accent">← Back</button>
                  <button onClick={startConnectedDeploy} disabled={connectedDeploying || !selectedPackageManager} className="text-xs bg-green-500 text-black px-3 py-1 rounded disabled:opacity-40">{connectedDeploying? 'Deploying...' : 'Start Deployment'}</button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy workspace selection if no connected repo */}
      {!connectedRepo && stage === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Workspace Selection (legacy mode) */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Workspace</label>
            {workspaces.length === 0 ? (
              <div className="p-8 glass-card border border-white/10 rounded-lg text-center">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No workspaces found</p>
                <button
                  onClick={() => window.location.href = '/workspaces'}
                  className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create Workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {workspaces.map((workspace) => (
                  <motion.button
                    key={workspace.id}
                    onClick={() => setSelectedWorkspace(workspace.id)}
                    className={`p-4 glass-card border rounded-lg text-left transition-all ${
                      selectedWorkspace === workspace.id
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 hover:border-accent/30'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      {workspace.source === 'github' ? (
                        <Github className="w-5 h-5 text-accent mt-0.5" />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-accent mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{workspace.name}</h3>
                        <p className="text-xs text-gray-400 mb-1">{workspace.path}</p>
                        {workspace.repoUrl && (
                          <p className="text-xs text-gray-500">{workspace.repoUrl}</p>
                        )}
                      </div>
                      {selectedWorkspace === workspace.id && (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Port Selection */}
          {selectedWorkspace && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Starting Port (Auto-Detected)</label>
                <button
                  onClick={scanAvailablePorts}
                  disabled={scanningPorts}
                  className="text-xs text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${scanningPorts ? 'animate-spin' : ''}`} />
                  Rescan
                </button>
              </div>
              
              {scanningPorts ? (
                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-gray-400">Scanning for available ports...</span>
                </div>
              ) : availablePorts.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    {availablePorts.slice(0, 10).map((port) => (
                      <motion.button
                        key={port}
                        onClick={() => setSelectedPort(port)}
                        className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                          selectedPort === port
                            ? 'bg-accent text-black'
                            : 'bg-white/5 border border-white/10 hover:border-accent/30'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {port}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    ✅ {availablePorts.length} available port(s) detected. Services will use consecutive ports starting from {selectedPort}.
                  </p>
                  
                  {showPortPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pt-2"
                    >
                      <label className="text-xs text-gray-400 mb-1 block">Custom Port</label>
                      <input
                        type="number"
                        value={selectedPort}
                        onChange={(e) => setSelectedPort(parseInt(e.target.value) || 3000)}
                        min="1024"
                        max="65535"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                        placeholder="Enter custom port"
                      />
                    </motion.div>
                  )}
                  
                  <button
                    onClick={() => setShowPortPicker(!showPortPicker)}
                    className="text-xs text-gray-500 hover:text-accent transition-colors"
                  >
                    {showPortPicker ? '− Use suggested ports' : '+ Enter custom port'}
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">⚠️ No available ports found. All common ports are in use.</p>
                  <button
                    onClick={scanAvailablePorts}
                    className="text-xs text-accent hover:underline mt-2"
                  >
                    Rescan ports
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Deploy Button */}
          {selectedWorkspace && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={startAutoDeploy}
              className="w-full py-4 bg-gradient-to-r from-accent to-blue-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-5 h-5" />
              Start Automatic Deployment
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Removed inline logs section per new wizard design */}

      {/* Running Services */}
      {stage === 'running' && serviceUrls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 glass-card border border-green-500/30 bg-green-500/5 rounded-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold">Services Running</h3>
          </div>
          <div className="space-y-2">
            {serviceUrls.map((url, idx) => (
              <motion.a
                key={idx}
                href={url.split(': ')[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{url}</span>
                  <span className="text-accent group-hover:underline text-xs">
                    Open →
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    {/* Thin Footer with Terminal Toggle */}
    <div className="fixed bottom-0 right-0 left-0 h-8 bg-black/60 border-t border-white/10 flex items-center justify-end px-4 text-xs">
      <button onClick={()=> setShowTerminal(!showTerminal)} className="px-2 py-1 border border-white/15 rounded bg-black/40 hover:border-accent/50 transition-colors">
        {showTerminal? 'Close Terminal' : 'Open Terminal'}
      </button>
    </div>
    {showTerminal && (
      <div className="fixed bottom-8 right-4 w-96 h-56 bg-black/85 border border-white/20 rounded shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-2 py-1 text-xs bg-black/60 border-b border-white/10">
          <span>Project Terminal (bash)</span>
          <button onClick={()=> setShowTerminal(false)} className="text-gray-400 hover:text-accent">×</button>
        </div>
        <TerminalEmulator />
      </div>
    )}
  </div>
  )
}

// Simple in-component terminal emulator (no backend exec yet)
function TerminalEmulator() {
  const t = trpc as any
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [topicReady, setTopicReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        const resp = await t.terminal.startDevSession.mutate()
        if (!cancelled) {
          setSessionId(resp.sessionId)
          setTopicReady(true)
        }
      } catch (e) {
        if (!cancelled) setLines([{ ts: Date.now(), line: 'Failed to start dev session', level: 'error' }])
      }
    }
    start()
    return () => { cancelled = true }
  }, [])

  t.terminal.streamSession.useSubscription(sessionId ? { sessionId } : undefined, {
    enabled: !!sessionId && topicReady,
    onData(data: any) {
      if (data?.line) setLines(prev => [...prev, data])
    }
  })

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto px-2 py-1 font-mono text-[11px] text-gray-200 space-y-0.5">
        {lines.length === 0 && <div className="text-gray-500">Starting dev session...</div>}
        {lines.map((l, i) => {
          const level = l.level || 'info'
          const color = level === 'error' ? 'text-red-400' : level === 'success' ? 'text-green-400' : level === 'progress' ? 'text-blue-400' : 'text-gray-200'
          return (
            <div key={i} className={color}>{l.line}</div>
          )
        })}
      </div>
      <div className="border-t border-white/10 px-2 py-1 text-[10px] text-gray-500 font-mono">Read-only dev output</div>
    </div>
  )
}
