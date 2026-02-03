"use client"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useProject } from "@/lib/project-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ConnectRepoModal } from "@/components/connect-repo-modal"
import { PageTitle } from '@/components/layout/page-title'
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { GitHubActivity } from "@/components/dashboard/github-activity"
import { LiveLogs } from "@/components/dashboard/live-logs"
import { 
  TrendingUp, Server, Activity, Zap, Shield, Brain, RefreshCcw, Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { trpc } from "@/lib/trpc"
import { AuthLoading } from "@/components/auth/loading"
import { motion } from "framer-motion"
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary"
import { useUserRole } from "@/hooks/useUserRole"
import { QuickActionsPanel } from "@/components/ui/quick-actions-panel"
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts"
import { StatCard } from "@/components/ui/stat-card"

export default function Overview() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { isDeploying, setDeploying, lastDeployment, setLastDeployment } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()
  const { currentProject } = useProject()

  const [metrics, setMetrics] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [repository, setRepository] = useState<any>(null)
  const [repoLoading, setRepoLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const t = trpc as any
  const triggerDeployment = t.deploy.create.useMutation()
  const metricsQuery = t.metrics.latest.useQuery(undefined, {
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  })
  const logsQuery = t.logs.recent.useQuery({ limit: 50 }, {
    refetchInterval: 2000,
    refetchOnWindowFocus: false,
  })
  const healthQuery = t.healthChecks.status.useQuery({ projectId: currentProject?.id }, { 
    enabled: !!currentProject?.id 
  })
  const servicesSummaryQuery = t.metrics.servicesSummary.useQuery()
  const deploymentsQuery = t.deploy.stats.useQuery({ projectId: currentProject?.id }, { 
    enabled: !!currentProject?.id 
  })

  // Fetch connected repository for current project (or fallback to user's primary)
  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const query = currentProject ? `?projectSlug=${encodeURIComponent(currentProject.slug)}` : ''
        const res = await fetch(`/api/repository${query}`)
        let data = null
        if (res.ok) {
          try {
            data = await res.json()
          } catch (jsonErr) {
            console.error('Error parsing repository response:', jsonErr)
            data = null
          }
        } else {
          // Try to parse error message if present
          try {
            data = await res.json()
          } catch {}
        }
        if (data && data.repository) {
          setRepository(data.repository)
        }
      } catch (error) {
        console.error('Error fetching repository:', error)
      } finally {
        setRepoLoading(false)
      }
    }
    
    if (isSignedIn) {
      fetchRepository()
    }
  }, [isSignedIn, currentProject])

  useEffect(() => {
    if (!metricsQuery.isLoading && metricsQuery.data) {
      setMetrics(metricsQuery.data)
      setMetricsLoading(false)
    }
    if (!metricsQuery.isLoading && metricsQuery.isError) {
      setMetricsLoading(false)
    }
  }, [metricsQuery.data, metricsQuery.isLoading, metricsQuery.isError])

  useEffect(() => {
    if (logsQuery.data?.items) {
      setLogs(logsQuery.data.items)
    }
  }, [logsQuery.data])

  useEffect(() => {
    // Redirect to landing if user is not signed in
    if (isLoaded && !isSignedIn) {
      router.replace("/landing")
      return
    }
    
    // Redirect to projects page if no project is selected
    if (isLoaded && isSignedIn && !currentProject) {
      router.replace("/projects")
    }
  }, [isLoaded, isSignedIn, currentProject, router])

  // Show loading/auth check
  if (!isLoaded || !isSignedIn) return <AuthLoading />

  const handleQuickDeploy = async () => {
    // Check if there's a last successful deployment
    if (!lastDeployment || !lastDeployment.image) {
      addToast({
        type: "error",
        title: "No Previous Deployment",
        description: "Please deploy an image first before using Quick Deploy",
      })
      return
    }

    // Check if last deployment was successful
    if (lastDeployment.status === 'failed') {
      addToast({
        type: "warning",
        title: "Last Deployment Failed",
        description: "The previous deployment failed. Please check logs before retrying.",
      })
      return
    }

    setDeploying(true)
    try {
      // Use real backend tRPC to create a deployment record
      const services = (lastDeployment.ports || []).map((p: number) => ({
        name: `service-${p}`,
        port: p,
        url: `http://localhost:${p}`,
        status: 'starting',
      }))
      const result = await triggerDeployment.mutateAsync({
        branch: lastDeployment.branch || 'main',
        commit: lastDeployment.commit || undefined,
        summary: lastDeployment.image
          ? `Quick deploy: ${lastDeployment.image} on ports ${lastDeployment.ports?.join(', ')}`
          : `Deployment triggered from ${lastDeployment.branch || 'main'}`,
        services,
      })

      setLastDeployment({
        id: result.id,
        branch: result.branch || lastDeployment.branch || 'main',
        commit: result.commit || lastDeployment.commit || '',
        status: result.status || 'running',
        image: lastDeployment.image,
        ports: lastDeployment.ports,
        timestamp: new Date().toISOString(),
      })

      addToast({
        type: 'success',
        title: 'Deployment Started',
        description: result.summary || 'Deployment kicked off',
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Deployment Error",
        description: error instanceof Error ? error.message : "Failed to trigger deployment",
      })
    } finally {
      setTimeout(() => setDeploying(false), 1000)
    }
  }

  const handleRollback = () => {
    addToast({
      type: "warning",
      title: "Rollback Initiated",
      description: "Rolling back to previous stable version...",
    })
  }

  const handleViewLogs = () => {
    router.push("/logs")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMetricsLoading(true)
    
    try {
      await metricsQuery.refetch()
      addToast({
        type: "success",
        title: "Refreshed",
        description: "Dashboard data updated",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Refresh Failed",
        description: "Could not refresh dashboard data",
      })
    } finally {
      // Show loading for at least 500ms so user sees the feedback
      setTimeout(() => {
        setIsRefreshing(false)
        setMetricsLoading(false)
      }, 500)
    }
  }

  // Test function to set a mock deployment (for development)
  const handleTestDeploy = async () => {
    setDeploying(true)
    try {
      const services = [3000, 8080].map((p) => ({
        name: `service-${p}`,
        port: p,
        url: `http://localhost:${p}`,
        status: 'starting',
      }))
      const result = await triggerDeployment.mutateAsync({
        branch: 'main',
        summary: 'Test deployment via tRPC',
        services,
      })

      setLastDeployment({
        id: result.id,
        branch: result.branch || 'main',
        commit: result.commit || '',
        status: result.status || 'running',
        image: 'my-app:latest',
        ports: [3000, 8080],
        timestamp: new Date().toISOString(),
      })

      addToast({
        type: 'success',
        title: 'Test Deployment Created',
        description: 'You can now use Quick Deploy to redeploy this image',
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Test Deploy Error",
        description: error instanceof Error ? error.message : "Failed to create test deployment",
      })
    } finally {
      setTimeout(() => setDeploying(false), 1000)
    }
  }

  const handleConnectRepo = async (repo: any) => {
    try {
      // Extract owner and repo name from full_name (format: "owner/repo")
      const [owner, repoName] = repo.full_name.split('/')
      
      const response = await fetch('/api/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: owner,
          repo: repoName,
          description: repo.description || '',
          projectSlug: currentProject?.slug,
        }),
      })

      let data = null
      if (response.ok) {
        try {
          data = await response.json()
        } catch (jsonErr) {
          console.error('Error parsing repository response:', jsonErr)
          data = null
        }
        setRepository(data?.repository)
        // refresh from server to include any project binding
        try {
          const query = currentProject ? `?projectSlug=${encodeURIComponent(currentProject.slug)}` : ''
          const latest = await fetch(`/api/repository${query}`)
          let latestData = null
          if (latest.ok) {
            try {
              latestData = await latest.json()
            } catch {}
          }
          if (latestData && latestData.repository) setRepository(latestData.repository)
        } catch {}
        addToast({
          type: "success",
          title: "Repository Connected",
          description: `Successfully connected ${repo.full_name}`,
        })
      } else {
        let errorData = null
        try {
          errorData = await response.json()
        } catch {}
        throw new Error(errorData?.error || 'Failed to connect repository')
      }
    } catch (error) {
      console.error('Repository connection error:', error)
      addToast({
        type: "error",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect repository",
      })
    }
  }

  const keyboardShortcuts = [
    {
      key: "d",
      description: "Quick Deploy",
      modifiers: ["meta"] as const,
      action: handleQuickDeploy,
    },
    {
      key: "r",
      description: "Refresh Metrics",
      modifiers: [] as const,
      action: handleRefresh,
    },
    {
      key: "l",
      description: "View Logs",
      modifiers: ["meta"] as const,
      action: handleViewLogs,
    },
  ]

  return (
    <AnimationErrorBoundary fallbackType="auto" userRole={userRole}>
      <AppShell>
        <ToastContainer />
        <motion.main 
          className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-[100vw]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Workspace Overview header moved to top, above connect repo */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />
                </motion.div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Workspace Overview</h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Your local infrastructure runtime—offline, deterministic, and production-ready</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
              <motion.button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh Metrics"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 sm:flex-initial"
              >
                <Button
                  loading={isDeploying}
                  loadingText="Deploying..."
                  onClick={handleQuickDeploy}
                  className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center font-medium backdrop-blur-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                  <span>Quick Deploy</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Connect Repository Section (kept below title) */}
          <GitHubActivity 
            repository={repository} 
            loading={repoLoading}
            onConnectClick={() => setShowConnectModal(true)}
          />


          {/* Quick Stats Overview - Responsive Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6"
          >
            <StatCard
              title="System Health"
              value={healthQuery.data?.status === 'healthy' ? 'Healthy' : 'Degraded'}
              icon={Shield}
              color={healthQuery.data?.status === 'healthy' ? 'success' : 'warning'}
              subtitle={healthQuery.data ? `Uptime: ${healthQuery.data.uptime}%` : 'Checking...'}
              onClick={() => router.push("/services")}
              delay={0.1}
            />
            <StatCard
              title="Active Services"
              value={servicesSummaryQuery.data ? servicesSummaryQuery.data.length.toString() : '0'}
              icon={Server}
              color="accent"
              subtitle="Running containers"
              onClick={() => router.push("/services")}
              delay={0.15}
            />
            <StatCard
              title="Deployments Today"
              value={deploymentsQuery.data?.todayCount?.toString() || '0'}
              icon={Zap}
              color="warning"
              subtitle="Successful deploys"
              onClick={() => router.push("/deployments")}
              delay={0.2}
            />
            <StatCard
              title="Avg Latency"
              value={metrics?.latency ? `${Math.round(metrics.latency)}ms` : '—'}
              icon={Activity}
              color="success"
              subtitle="Global average"
              onClick={() => router.push("/logs")}
              delay={0.25}
            />
          </motion.div>

          <QuickActionsPanel
            userRole={userRole}
            onDeploy={handleQuickDeploy}
            onRollback={handleRollback}
            onViewLogs={handleViewLogs}
            onRefresh={handleRefresh}
          />

          {/* Dev-only: Test deployment button */}
          {process.env.NODE_ENV === 'development' && !lastDeployment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-blue-400">Development Mode</h3>
                  <p className="text-xs text-gray-400">Create a test deployment to enable Quick Deploy</p>
                </div>
                <button
                  onClick={handleTestDeploy}
                  disabled={isDeploying}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs sm:text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeploying ? 'Creating...' : 'Create Test Deployment'}
                </button>
              </div>
            </motion.div>
          )}

          <MetricsCard metrics={metrics} loading={metricsLoading || isRefreshing} />
          <LiveLogs logs={logs} />
        </motion.main>
      </AppShell>
      <KeyboardShortcuts shortcuts={keyboardShortcuts} />
      <ConnectRepoModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectRepo}
      />
    </AnimationErrorBoundary>
  )
}
