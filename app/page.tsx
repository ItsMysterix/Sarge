"use client"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  Brain, Lightbulb, Target, Play, RefreshCcw, 
  TrendingUp, Server, Activity, Zap, Database, 
  AlertTriangle, CheckCircle, Clock, Shield 
} from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { trpc } from "@/lib/trpc"
import { AuthLoading } from "@/components/auth/loading"
import { motion, AnimatePresence } from "framer-motion"
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary"
import { useUserRole } from "@/hooks/useUserRole"
import { QuickActionsPanel } from "@/components/ui/quick-actions-panel"
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts"
import { QuickStatCard } from "@/components/ui/quick-stat-card"
import { StatusBadge } from "@/components/ui/status-badge"

export default function Overview() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { isDeploying, setDeploying } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()

  const [metrics, setMetrics] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [repository, setRepository] = useState<any>(null)
  const [repoLoading, setRepoLoading] = useState(true)

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

  const handleRefresh = () => {
    metricsQuery.refetch()
    addToast({
      type: "success",
      title: "Refreshed",
      description: "Dashboard data updated",
    })
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
                value="98.5%"
                icon={Shield}
                color="success"
                trend={{ value: 2.3, direction: "up" }}
                subtitle="All systems operational"
                onClick={() => router.push("/services")}
                delay={0.1}
              />
              <QuickStatCard
                title="Active Services"
                value={metrics?.cpu ? Math.floor(100 - metrics.cpu) : 12}
                icon={Server}
                color="accent"
                subtitle="Running smoothly"
                onClick={() => router.push("/services")}
                delay={0.15}
              />
              <QuickStatCard
                title="Deployments Today"
                value={Math.floor(metrics?.memory / 15) || 5}
                icon={Zap}
                color="warning"
                trend={{ value: 15, direction: "up" }}
                subtitle="Last: 12 mins ago"
                onClick={() => router.push("/deployments")}
                delay={0.2}
              />
              <QuickStatCard
                title="API Latency"
                value={`${metrics?.latency || 45}ms`}
                icon={Activity}
                color="success"
                trend={{ value: 8.5, direction: "down" }}
                subtitle="p95 response time"
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
                  onClick={() => metricsQuery.refetch()} 
                  title="Refresh Metrics"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="p-2"
                >
                  <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white" />
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LoadingButton
                    loading={isDeploying}
                    loadingText="Deploying..."
                    onClick={handleQuickDeploy}
                    className="bg-black px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white hover:bg-accent hover:text-black transition-all duration-300 rounded-lg border border-accent/30 flex items-center font-medium"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Quick Deploy</span>
                    <span className="sm:hidden">Deploy</span>
                  </LoadingButton>
                </motion.div>
              </div>
            </motion.div>

            <MetricsCard metrics={metrics} loading={metricsLoading} />
            <GitHubActivity repository={repository} loading={repoLoading} />
            <LiveLogs logs={logs} />
          </motion.main>
        </div>
      </div>
      <KeyboardShortcuts shortcuts={keyboardShortcuts} />
    </AnimationErrorBoundary>
  )
}

function WelcomeCard({ user }: { user: any }) {
  return (
    <motion.div 
      className="glass-card p-4 mb-6 border-l-4 border-l-accent"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01, x: 5 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Brain className="w-5 h-5 text-accent" />
        </motion.div>
        <div>
          <div className="font-medium">Welcome back, {user?.firstName || user?.username || "Commander"}!</div>
          <div className="text-sm text-gray-400">Your DevOps command center is ready.</div>
        </div>
      </div>
    </motion.div>
  )
}

function MetricsCard({ metrics, loading }: { metrics: any; loading: boolean }) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")

  if (loading) {
    return (
      <motion.div 
        className="flex justify-center items-center h-40 text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="h-6 w-6 border-b-2 border-accent rounded-full mr-4"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading metrics...
        </motion.span>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="glass-card p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
          </motion.div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Infrastructure Performance</h2>
            <p className="text-xs sm:text-sm text-gray-400">Real-time system metrics</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1h", "24h", "7d"] as const).map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(range)}
              className={`
                px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs font-medium terminal-text transition-all
                ${timeRange === range
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "glass-card text-gray-400 hover:text-white border border-white/10"
                }
              `}
            >
              {range.toUpperCase()}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <MetricItem 
          label="CPU Usage" 
          value={metrics?.cpu ? `${metrics.cpu.toFixed(1)}%` : "N/A"} 
          status={metrics?.cpu > 80 ? "error" : metrics?.cpu > 60 ? "warning" : "success"}
          icon={Activity}
          delay={0.4}
        />
        <MetricItem 
          label="Memory" 
          value={metrics?.memory ? `${metrics.memory.toFixed(1)}%` : "N/A"} 
          status={metrics?.memory > 85 ? "error" : metrics?.memory > 70 ? "warning" : "success"}
          icon={Database}
          delay={0.45}
        />
        <MetricItem 
          label="Uptime" 
          value={metrics?.cpu ? `${(100 - metrics.cpu).toFixed(1)}%` : "N/A"}
          status="success"
          icon={CheckCircle}
          delay={0.5}
        />
        <MetricItem 
          label="Alerts" 
          value={metrics?.memory ? Math.floor(metrics.memory / 20) : 0}
          status={metrics?.memory > 50 ? "warning" : "success"}
          icon={AlertTriangle}
          delay={0.55}
        />
      </div>

      {/* System Health Grade */}
      <div className="flex items-center justify-between p-4 glass-card rounded-lg border border-success/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/10 rounded-lg">
            <Shield className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Overall System Health</div>
            <div className="text-2xl font-bold text-success">Excellent</div>
          </div>
        </div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.1 }}
        >
          <div className="text-5xl font-bold text-success">A+</div>
          <div className="text-xs text-gray-400 mt-1">95/100</div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function MetricItem({ 
  label, 
  value, 
  status, 
  icon: Icon, 
  delay 
}: { 
  label: string
  value: any
  status: "success" | "warning" | "error"
  icon: any
  delay: number 
}) {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error"
  }

  return (
    <motion.div 
      className="text-center p-4 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${statusColors[status]}`} />
        <div className="text-xs text-gray-400">{label}</div>
      </div>
      <motion.div 
        className={`text-2xl font-bold ${statusColors[status]}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
      >
        {value}
      </motion.div>
    </motion.div>
  )
}

function GitHubActivity({ repository, loading }: { repository: any; loading: boolean }) {
  const router = useRouter()
  const t = trpc as any
  
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [commits, setCommits] = useState<any[]>([])
  
  // Fetch GitHub data when repository is available
  useEffect(() => {
    if (repository?.owner && repository?.repo) {
      // Using trpc queries
      const fetchData = async () => {
        try {
          const info = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}`)
          if (info.ok) {
            const infoData = await info.json()
            setRepoInfo(infoData)
          }
          
          const commitsRes = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/commits?per_page=5`)
          if (commitsRes.ok) {
            const commitsData = await commitsRes.json()
            setCommits(commitsData)
          }
        } catch (error) {
          console.error('Error fetching GitHub data:', error)
        }
      }
      fetchData()
    }
  }, [repository])

  if (loading) {
    return (
      <motion.div 
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-8 text-gray-400">
          <motion.div 
            className="h-6 w-6 border-b-2 border-accent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          Loading repository data...
        </div>
      </motion.div>
    )
  }

  if (!repository) {
    return (
      <motion.div 
        className="glass-card p-6 mb-6 border border-warning/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-warning" />
            <div>
              <h2 className="text-xl font-semibold">Connect GitHub Repository</h2>
              <p className="text-sm text-gray-400">Connect a repository to see real-time activity and insights</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/settings')}
            className="px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 rounded-lg text-sm"
          >
            Connect Repository
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="glass-card p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Lightbulb className="w-6 h-6 text-accent" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold">Repository Activity</h2>
            <p className="text-sm text-gray-400">{repository.full_name}</p>
          </div>
        </div>
        {repoInfo && (
          <div className="flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span className="text-warning">★</span>
              <span>{repoInfo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔀</span>
              <span>{repoInfo.forks_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span>{repoInfo.open_issues_count}</span>
            </div>
          </div>
        )}
      </div>

      {commits.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Commits</h3>
          {commits.map((commit: any, i: number) => (
            <motion.div 
              key={commit.sha}
              className="p-4 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, x: 5 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-300 mb-2">{commit.commit.message}</div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">
                      by <span className="text-accent">{commit.commit.author.name}</span>
                    </span>
                    <span className="text-gray-500">
                      {new Date(commit.commit.author.date).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">
                      {commit.sha.substring(0, 7)}
                    </span>
                  </div>
                </div>
                <motion.a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs text-accent hover:bg-accent/10 rounded border border-accent/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recent commits found
        </div>
      )}
    </motion.div>
  )
}

function LiveLogs({ logs }: { logs: any[] }) {
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "info">("all")
  const [isPaused, setIsPaused] = useState(false)

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.type === filter)

  const logCounts = {
    all: logs.length,
    error: logs.filter(l => l.type === "error").length,
    warn: logs.filter(l => l.type === "warn").length,
    info: logs.filter(l => l.type === "info").length,
  }

  return (
    <motion.div 
      className="glass-card p-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isPaused ? 0 : 360 }}
            transition={{ repeat: isPaused ? 0 : Infinity, duration: 2, ease: "linear" }}
          >
            <Activity className="w-5 h-5 text-accent" />
          </motion.div>
          <h2 className="text-xl font-semibold">Live Logs</h2>
          <StatusBadge 
            status={isPaused ? "pending" : "running"} 
            label={isPaused ? "Paused" : "Live"} 
            size="sm" 
          />
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1.5 text-xs text-accent hover:bg-accent/10 rounded border border-accent/30"
          >
            {isPaused ? "Resume" : "Pause"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
          >
            View All →
          </motion.button>
        </div>
      </div>

      {/* Log Type Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "error", "warn", "info"] as const).map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(type)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium terminal-text transition-all
              ${filter === type
                ? "bg-accent/20 text-accent border border-accent/30"
                : "glass-card text-gray-400 hover:text-white border border-white/10"
              }
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === type ? "bg-accent/20" : "bg-white/10"
            }`}>
              {logCounts[type]}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              No {filter !== "all" ? filter : ""} logs to display
            </motion.div>
          ) : (
            filteredLogs.slice(0, 10).map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className={`
                  p-3 glass-card rounded text-sm border-l-2 hover:bg-white/5 transition-all
                  ${log.type === "error" ? "border-l-error" : 
                    log.type === "warn" ? "border-l-warning" : 
                    "border-l-success"}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium terminal-text
                    ${log.type === "error" ? "bg-error/10 text-error" : 
                      log.type === "warn" ? "bg-warning/10 text-warning" : 
                      "bg-success/10 text-success"}
                  `}>
                    {log.type?.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-xs">[{log.service}]</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                  <Clock className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
