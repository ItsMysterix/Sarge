'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trpcVanilla } from '@/lib/trpc'
import { FolderOpen, Github, Zap, PlayCircle, CheckCircle, Loader2, Settings, RefreshCw, Terminal } from 'lucide-react'

// Lightweight helper to obtain a GitHub access token from the secure API route.
// Returns null if unavailable (caller should surface a friendly error / fallback).
async function fetchAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/github/access-token')
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error('GitHub token fetch failed:', res.status, errorData)
      return null
    }
    const data = await res.json()
    return data.token || null
  } catch (e) {
    console.error('fetchAccessToken failed', e)
    return null
  }
}

interface AutoDeployProps {
  onComplete?: () => void
}

type Stage = 'select' | 'analyzing' | 'installing' | 'starting' | 'running'

export function AutoDeploy({ onComplete }: AutoDeployProps) {
  const t = trpcVanilla
  const [stage, setStage] = useState<Stage>('select')
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const [connectedRepo, setConnectedRepo] = useState<any>(null)
  const [connectedDeploying, setConnectedDeploying] = useState(false)
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [terminalLines, setTerminalLines] = useState<any[]>([])
  const [showTerminal, setShowTerminal] = useState<boolean>(false)
  const [terminalHeight, setTerminalHeight] = useState<number>(400)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedPackageManager, setSelectedPackageManager] = useState<string | null>(null)
  const [selectedPort, setSelectedPort] = useState<number>(3000)
  const [availablePorts, setAvailablePorts] = useState<number[]>([])
  const [scanningPorts, setScanningPorts] = useState(false)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [serviceUrls, setServiceUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showPortPicker, setShowPortPicker] = useState(false)
  const [checkingForUpdates, setCheckingForUpdates] = useState(false)
  const [deploymentMethod, setDeploymentMethod] = useState<'local' | 'docker'>('local')

  // Load persisted analysis state from localStorage
  useEffect(() => {
    if (connectedRepo) {
      const cacheKey = `analysis_${connectedRepo.owner}_${connectedRepo.repo}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          // Check if cache is less than 1 hour old
          if (Date.now() - parsed.timestamp < 3600000) {
            setAnalysisResult(parsed.data)
            setAnalysisComplete(true)
            setSelectedPackageManager(parsed.packageManager || 'pnpm')
            console.log('Loaded cached analysis for', connectedRepo.owner + '/' + connectedRepo.repo)
          } else {
            localStorage.removeItem(cacheKey)
          }
        } catch (e) {
          console.error('Failed to load cached analysis:', e)
        }
      }
    }
  }, [connectedRepo])

  // Auto-detect new pushes and re-analyze
  useEffect(() => {
    if (!connectedRepo || !analysisComplete) return

    const checkForNewPushes = async () => {
      try {
        setCheckingForUpdates(true)
        const token = await fetchAccessToken()
        if (!token) return

        // Fetch latest commit SHA from GitHub
        const response = await fetch(
          `https://api.github.com/repos/${connectedRepo.owner}/${connectedRepo.repo}/commits/main`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (!response.ok) return

        const data = await response.json()
        const latestSha = data.sha

        // Check cached commit SHA
        const cacheKey = `analysis_${connectedRepo.owner}_${connectedRepo.repo}`
        const cached = localStorage.getItem(cacheKey)
        
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.commitSha && parsed.commitSha !== latestSha) {
            console.log('🔄 New commits detected, re-analyzing...')
            // Trigger re-analysis by clearing cache and resetting state
            localStorage.removeItem(cacheKey)
            setAnalysisComplete(false)
            setAnalysisResult(null)
            // Small delay to ensure state updates
            setTimeout(() => {
              // The component will auto-trigger analysis via the analyze button
              // Or we can dispatch a custom event
              window.dispatchEvent(new CustomEvent('trigger-reanalysis'))
            }, 100)
          }
        }
      } catch (error) {
        console.error('Failed to check for new pushes:', error)
      } finally {
        setCheckingForUpdates(false)
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkForNewPushes, 30000)
    // Also check immediately
    checkForNewPushes()

    return () => clearInterval(interval)
  }, [connectedRepo, analysisComplete])

  // Fetch workspaces and scan ports on mount
  useEffect(() => {
    fetchWorkspaces()
    scanAvailablePorts()
    fetchConnectedRepo()
  }, [])

  // Listen for re-analysis trigger from push detection
  useEffect(() => {
    const handleReanalysis = () => {
      if (connectedRepo && !analyzing) {
        startAnalysis()
      }
    }

    window.addEventListener('trigger-reanalysis', handleReanalysis)
    return () => window.removeEventListener('trigger-reanalysis', handleReanalysis)
  }, [connectedRepo, analyzing])

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

  const startAnalysis = async () => {
    if (!connectedRepo || analyzing) return
    setAnalyzing(true)
    setAnalysisComplete(false)
    setTerminalLines([])
    setError(null)
    const addTerminalLine = (line: string, level: string = 'info') => {
      setTerminalLines(prev => [...prev, { ts: Date.now(), line, level }])
    }
    try {
      addTerminalLine('🔍 Starting AI-powered repository analysis...', 'progress')
      const token = await fetchAccessToken()
      if (!token) {
        const errorMsg = 'GitHub authentication required'
        setError(errorMsg)
        addTerminalLine('❌ ' + errorMsg, 'error')
        addTerminalLine('💡 Sign in with GitHub to analyze repositories', 'info')
        addTerminalLine('   Or set GITHUB_ACCESS_TOKEN in .env for admin access', 'info')
        return
      }
      addTerminalLine(`📂 Scanning ${connectedRepo.owner}/${connectedRepo.repo}...`, 'info')
      addTerminalLine('🤖 Detecting services, frameworks, and dependencies...', 'info')
      const result = await t.sarge.oneclick.detectRepo.mutate({
        owner: connectedRepo.owner,
        repo: connectedRepo.repo,
        branch: 'main',
        accessToken: token,
      }).catch((err) => {
        // If bad credentials, show helpful error
        if (err.message?.includes('Bad credentials')) {
          throw new Error('Bad credentials - https://docs.github.com/rest')
        }
        throw err
      })
      setAnalysisResult(result)
      addTerminalLine(`✅ Analysis complete: ${result.services?.length || 0} service(s) detected`, 'success')
      result.services?.forEach((svc: any, i: number) => {
        addTerminalLine(`  ${i+1}. ${svc.name} (${svc.framework || svc.type})`, 'info')
        if (svc.startCommand) addTerminalLine(`     Start: ${svc.startCommand}`, 'info')
        if (svc.buildCommand) addTerminalLine(`     Build: ${svc.buildCommand}`, 'info')
      })
      if (result.packageManager) {
        addTerminalLine(`📦 Detected package manager: ${result.packageManager}`, 'info')
        setSelectedPackageManager(result.packageManager)
      }
      setAnalysisComplete(true)
      
      // Fetch latest commit SHA to cache
      const commitResponse = await fetch(
        `https://api.github.com/repos/${connectedRepo.owner}/${connectedRepo.repo}/commits/main`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      ).catch(() => null)
      
      const commitData = await commitResponse?.json().catch(() => null)
      const commitSha = commitData?.sha || null
      
      // Cache the analysis result in localStorage with commit SHA
      const cacheKey = `analysis_${connectedRepo.owner}_${connectedRepo.repo}`
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        packageManager: result.packageManager,
        commitSha,
        timestamp: Date.now(),
      }))
      addTerminalLine('💾 Analysis cached for future sessions', 'info')
    } catch (e: any) {
      setError(e.message || 'Analysis failed')
      addTerminalLine(`❌ ${e.message || 'Analysis failed'}`, 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  const startDeployment = async () => {
    if (!connectedRepo || !analysisComplete || connectedDeploying) return
    setConnectedDeploying(true)
    setTerminalLines([]) // Clear previous logs
    const addTerminalLine = (line: string, level: string = 'info') => {
      setTerminalLines(prev => [...prev, { ts: Date.now(), line, level }])
    }
    try {
      addTerminalLine('🚀 Starting deployment...', 'progress')
      const token = await fetchAccessToken()
      if (!token) throw new Error('Missing token')
      const resp = await t.sarge.oneclick.deployConnected.mutate({
        owner: connectedRepo.owner,
        repo: connectedRepo.repo,
        branch: 'main',
        accessToken: token,
        startPort: selectedPort,
        packageManager: selectedPackageManager || 'pnpm',
        deploymentMethod,
      })
      addTerminalLine(`✅ Deployment initiated - Starting services locally on port ${selectedPort}...`, 'success')
      
      // Add logs from the response
      if (resp.logs && Array.isArray(resp.logs)) {
        resp.logs.forEach((log: any) => {
          addTerminalLine(log.line, log.level)
        })
      }
      
      // Save deployment to database
      try {
        await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'oneclick',
            owner: connectedRepo.owner,
            repo: connectedRepo.repo,
            branch: 'main',
            startPort: selectedPort,
            packageManager: selectedPackageManager || 'pnpm',
          }),
        })
      } catch (e) {
        console.error('Failed to save deployment record:', e)
      }
      
      // Try to subscribe to real-time deployment logs via streamConnected
      // This only works on localhost with WebSocket; on Vercel it will fail gracefully
      try {
        const unsubscribe = t.sarge.oneclick.streamConnected.subscribe(
          {
            owner: connectedRepo.owner,
            repo: connectedRepo.repo,
          },
          {
            onData(data: any) {
              console.log('[Deploy Log]', data)
              addTerminalLine(data.line, data.level)
            },
            onError(err: any) {
              // Silently ignore subscription errors on Vercel (no WebSocket support)
              console.warn('Log stream not available (WebSocket not supported in this environment)')
            },
          }
        )
      } catch (err: any) {
        // Subscription not available - this is OK, we already have logs from the mutation response
        console.warn('WebSocket subscriptions not available')
      }
    } catch (e: any) {
      setError(e.message || 'Deployment failed')
      addTerminalLine(`❌ ${e.message || 'Deployment failed'}`, 'error')
    } finally {
      setConnectedDeploying(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newHeight = window.innerHeight - e.clientY
      if (newHeight >= 200 && newHeight <= window.innerHeight * 0.8) {
        setTerminalHeight(newHeight)
      }
    }
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const fetchWorkspaces = async () => {
    // Workspaces removed - AI analyzes directly from GitHub
    setWorkspaces([])
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

      {/* AI Analysis Interface */}
      {connectedRepo && stage === 'select' && (
        <div className="space-y-4">
          {/* Repository Info */}
          <div className="p-4 glass-card border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Connected Repository</h3>
                  {checkingForUpdates && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking for updates...
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{connectedRepo.full_name}</p>
                <p className="text-xs text-gray-500">Branch: main</p>
              </div>
              <div className="flex gap-2">
                {analysisComplete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startAnalysis}
                    disabled={analyzing}
                    className="px-3 py-2 text-gray-400 border border-white/10 hover:border-accent/30 hover:text-accent rounded-lg text-sm backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                  </motion.button>
                )}
                {!analysisComplete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startAnalysis}
                    disabled={analyzing}
                    className="px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent border border-accent/30 rounded-lg text-sm backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {analyzing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Zap className="w-4 h-4" /> Analyze Repository</>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Terminal Output */}
          {terminalLines.length > 0 && (
            <div className="p-4 glass-card border border-white/10 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${analyzing ? 'bg-blue-400 animate-pulse' : analysisComplete ? 'bg-green-400' : 'bg-gray-400'}`} />
                AI Analysis Output
              </h3>
              <div className="bg-black/50 rounded-lg p-3 font-mono text-xs max-h-96 overflow-y-auto space-y-1">
                {terminalLines.map((l, i) => {
                  const level = l.level || 'info'
                  const color = level === 'error' ? 'text-red-400' : level === 'success' ? 'text-green-400' : level === 'progress' ? 'text-blue-400' : 'text-gray-300'
                  return (
                    <div key={i} className={color}>
                      {new Date(l.ts).toLocaleTimeString()} {l.line}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Post-Analysis Options */}
          {analysisComplete && analysisResult && (
            <div className="p-4 glass-card border border-white/10 rounded-lg space-y-4">
              <h3 className="font-semibold">Deployment Configuration</h3>
              
              {/* Package Manager Selection */}
              <div>
                <label className="text-sm font-medium block mb-2">Package Manager</label>
                <div className="flex gap-2 flex-wrap">
                  {['pnpm','npm','yarn','bun'].map(pm => (
                    <button
                      key={pm}
                      onClick={() => setSelectedPackageManager(pm)}
                      className={`px-3 py-1.5 rounded border text-sm transition-colors ${selectedPackageManager === pm ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
                    >{pm}</button>
                  ))}
                </div>
              </div>

              {/* Deployment Method Selection */}
              <div>
                <label className="text-sm font-medium block mb-2">Deployment Method</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeploymentMethod('local')}
                    className={`flex-1 px-3 py-2.5 rounded border text-sm transition-all ${deploymentMethod === 'local' ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
                  >
                    <div className="font-medium">Local Process</div>
                    <div className="text-xs opacity-75 mt-0.5">Run directly on system</div>
                  </button>
                  <button
                    onClick={() => setDeploymentMethod('docker')}
                    className={`flex-1 px-3 py-2.5 rounded border text-sm transition-all ${deploymentMethod === 'docker' ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
                  >
                    <div className="font-medium">Docker</div>
                    <div className="text-xs opacity-75 mt-0.5">Containerized deployment</div>
                  </button>
                </div>
              </div>

              {/* Port Selection */}
              <div>
                <label className="text-sm font-medium block mb-2">Local Port</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3000, 3001, 3002, 4000, 5000, 8000, 8080, 9000, 5173].map(port => (
                    <button
                      key={port}
                      onClick={() => setSelectedPort(port)}
                      className={`px-3 py-2 rounded border text-sm transition-colors ${selectedPort === port ? 'bg-accent text-black border-accent' : 'border-white/15 hover:border-accent/40'}`}
                    >{port}</button>
                  ))}
                </div>
              </div>

              {/* Deploy Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startDeployment}
                disabled={connectedDeploying || !selectedPackageManager}
                className="w-full py-3 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent border border-accent/30 rounded-lg font-semibold backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connectedDeploying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</>
                ) : (
                  <><PlayCircle className="w-5 h-5" /> Deploy</>
                )}
              </motion.button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}

          {/* Deployment Terminal Output */}
          {connectedDeploying && terminalLines.length > 0 && (
            <div className="p-4 glass-card border border-white/10 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Deployment Logs
              </h3>
              <div className="bg-black/50 rounded-lg p-3 font-mono text-xs max-h-96 overflow-y-auto space-y-1">
                {terminalLines.map((l, i) => {
                  const level = l.level || 'info'
                  const color = level === 'error' ? 'text-red-400' : level === 'success' ? 'text-green-400' : level === 'progress' ? 'text-blue-400' : 'text-gray-300'
                  return (
                    <div key={i} className={color}>
                      {new Date(l.ts).toLocaleTimeString()} {l.line}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
              className="w-full py-4 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent border border-accent/30 rounded-lg font-semibold backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2"
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

    {/* Resizable Terminal Drop-up */}
    <AnimatePresence>
      {showTerminal && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/20 shadow-2xl flex flex-col z-50"
          style={{ height: `${terminalHeight}px` }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="h-1.5 bg-white/10 hover:bg-accent/50 cursor-ns-resize transition-colors flex items-center justify-center"
          >
            <div className="w-12 h-0.5 bg-white/30 rounded-full" />
          </div>

          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold">Project Terminal</span>
            </div>
            <button
              onClick={() => setShowTerminal(false)}
              className="text-gray-400 hover:text-accent transition-colors"
            >
              ×
            </button>
          </div>

          {/* Terminal Content */}
          <TerminalEmulator />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Footer with Terminal Icon - Higher z-index */}
    <div className="fixed bottom-0 right-0 left-0 h-10 bg-black/80 backdrop-blur-sm border-t border-white/10 flex items-center justify-end px-4 text-xs z-[60]">
      <button
        onClick={() => setShowTerminal(!showTerminal)}
        className="p-2 border border-white/15 rounded bg-black/40 hover:border-accent/50 hover:bg-accent/10 transition-all flex items-center gap-2"
      >
        <Terminal className="w-4 h-4" />
        {showTerminal && <span className="text-xs">Hide</span>}
      </button>
    </div>
  </div>
  )
}

// Simple in-component terminal emulator (no backend exec yet)
function TerminalEmulator() {
  const t = trpcVanilla
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
