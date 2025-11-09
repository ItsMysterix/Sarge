"use client"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ConnectRepoModal } from "@/components/connect-repo-modal"
import { WelcomeCard } from "@/components/dashboard/welcome-card"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { GitHubActivity } from "@/components/dashboard/github-activity"
import { LiveLogs } from "@/components/dashboard/live-logs"
import { 
  TrendingUp, Server, Activity, Zap, Shield, Brain, RefreshCcw, Play
} from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { trpc } from "@/lib/trpc"
import { AuthLoading } from "@/components/auth/loading"
import { motion } from "framer-motion"
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary"
import { useUserRole } from "@/hooks/useUserRole"
import { QuickActionsPanel } from "@/components/ui/quick-actions-panel"
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts"
import { QuickStatCard } from "@/components/ui/quick-stat-card"

export default function Overview() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { isDeploying, setDeploying } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()

  const [metrics, setMetrics] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [repository, setRepository] = useState<any>(null)
  const [repoLoading, setRepoLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const t = trpc as any
  const triggerDeployment = t.deploy.create.useMutation()
  const metricsQuery = t.metrics.latest.useQuery()

  // Fetch user's connected repository
  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const res = await fetch('/api/repository')
        const data = await res.json()
        if (data.repository) {
          setRepository(data.repository)
          // Fetch GitHub data for this repo
          const repoInfo = await t.github.getRepoInfo.useQuery({
            owner: data.repository.owner,
            repo: data.repository.repo,
          })
          if (repoInfo.data) {
            setRepository({ ...data.repository, github: repoInfo.data })
          }
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
  }, [isSignedIn])

  useEffect(() => {
    if (!metricsQuery.isLoading && metricsQuery.data) {
      setMetrics(metricsQuery.data)
      setMetricsLoading(false)
    }
    if (!metricsQuery.isLoading && metricsQuery.isError) {
      setMetricsLoading(false)
    }
  }, [metricsQuery.data, metricsQuery.isLoading, metricsQuery.isError])

  t.metrics.live.useSubscription(undefined, {
    onData(data: any) {
      setMetrics(data)
      setMetricsLoading(false)
    },
  })

  t.logs.stream.useSubscription(undefined, {
    onData(log: any) {
      setLogs((prev) => [log, ...prev.slice(0, 49)])
    },
  })

  useEffect(() => {
    // Redirect to landing if user is not signed in
    if (isLoaded && !isSignedIn) {
      router.replace("/landing")
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading/auth check
  if (!isLoaded || !isSignedIn) return <AuthLoading />

  const handleQuickDeploy = () => {
    setDeploying(true)
    triggerDeployment.mutate({ branch: "main" })
    addToast({
      type: "success",
      title: "Deployment Started",
      description: "Deployment has been triggered and is now in progress",
    })
    setTimeout(() => setDeploying(false), 1000)
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
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRepository(data.repository)
        addToast({
          type: "success",
          title: "Repository Connected",
          description: `Successfully connected ${repo.full_name}`,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect repository')
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
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
        <Sidebar />
        <ToastContainer />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <motion.main 
            className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <WelcomeCard user={user} />

            {/* Quick Stats Overview - Responsive Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
            >
              <QuickStatCard
                title="System Health"
                value="—"
                icon={Shield}
                color="success"
                subtitle="Coming Soon"
                onClick={() => router.push("/services")}
                delay={0.1}
              />
              <QuickStatCard
                title="Active Services"
                value="—"
                icon={Server}
                color="accent"
                subtitle="Deploy to track"
                onClick={() => router.push("/services")}
                delay={0.15}
              />
              <QuickStatCard
                title="Deployments Today"
                value="0"
                icon={Zap}
                color="warning"
                subtitle="Start your first deploy"
                onClick={() => router.push("/deployments")}
                delay={0.2}
              />
              <QuickStatCard
                title="API Latency"
                value="—"
                icon={Activity}
                color="success"
                subtitle="Metrics coming soon"
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

            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                  </motion.div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Workspace Overview</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-400">Your local infrastructure runtime—offline, deterministic, and production-ready</p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <motion.button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh Metrics"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LoadingButton
                    loading={isDeploying}
                    loadingText="Deploying..."
                    onClick={handleQuickDeploy}
                    className="px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center font-medium backdrop-blur-sm"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Quick Deploy</span>
                    <span className="sm:hidden">Deploy</span>
                  </LoadingButton>
                </motion.div>
              </div>
            </motion.div>

            <MetricsCard metrics={metrics} loading={metricsLoading || isRefreshing} />
            <GitHubActivity 
              repository={repository} 
              loading={repoLoading}
              onConnectClick={() => setShowConnectModal(true)}
            />
            <LiveLogs logs={logs} />
          </motion.main>
        </div>
      </div>
      <KeyboardShortcuts shortcuts={keyboardShortcuts} />
      <ConnectRepoModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectRepo}
      />
    </AnimationErrorBoundary>
  )
}
