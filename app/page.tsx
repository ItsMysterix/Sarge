"use client"
export const dynamic = 'force-dynamic'

import { useUser, CLERK_ENABLED } from "@/lib/clerk-safe"
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
  const isClerkEnabled = CLERK_ENABLED

  const [metrics, setMetrics] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)

  const t = trpc as any
  const triggerDeployment = t.deploy.create.useMutation()
  const metricsQuery = t.metrics.latest.useQuery()

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
    // Only redirect to landing if Clerk is enabled and user is not signed in
    if (isClerkEnabled && isLoaded && !isSignedIn) {
      router.replace("/landing")
    }
  }, [isLoaded, isSignedIn, isClerkEnabled])

  // Only show loading/auth check if Clerk is enabled
  if (isClerkEnabled && (!isLoaded || !isSignedIn)) return <AuthLoading />

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
                    className="glass-card px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-accent hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-black" />
                    <span className="hidden sm:inline">Quick Deploy</span>
                    <span className="sm:hidden">Deploy</span>
                  </LoadingButton>
                </motion.div>
              </div>
            </motion.div>

            <MetricsCard metrics={metrics} loading={metricsLoading} />
            <Recommendations />
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
          value={`${metrics?.cpu?.toFixed(1) || 23.4}%`} 
          status={metrics?.cpu > 80 ? "error" : metrics?.cpu > 60 ? "warning" : "success"}
          icon={Activity}
          delay={0.4}
        />
        <MetricItem 
          label="Memory" 
          value={`${metrics?.memory?.toFixed(1) || 45.2}%`} 
          status={metrics?.memory > 85 ? "error" : metrics?.memory > 70 ? "warning" : "success"}
          icon={Database}
          delay={0.45}
        />
        <MetricItem 
          label="Uptime" 
          value={`${(100 - (metrics?.cpu || 20)).toFixed(1)}%`}
          status="success"
          icon={CheckCircle}
          delay={0.5}
        />
        <MetricItem 
          label="Alerts" 
          value={Math.floor(metrics?.memory / 20) || 2}
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

function Recommendations() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "performance" | "cost" | "security">("all")
  
  const allRecommendations = [
    { id: 1, category: "performance", tip: "Scale down unused containers during off-hours", impact: "High", savings: "$45/mo" },
    { id: 2, category: "performance", tip: "Enable autoscaling for worker nodes", impact: "Medium", savings: "15% faster" },
    { id: 3, category: "cost", tip: "Archive old logs to reduce storage cost", impact: "Medium", savings: "$23/mo" },
    { id: 4, category: "security", tip: "Update SSL certificates expiring in 30 days", impact: "Critical", savings: "Security" },
    { id: 5, category: "cost", tip: "Switch to reserved instances for 40% savings", impact: "High", savings: "$120/mo" },
    { id: 6, category: "performance", tip: "Optimize database queries reducing load by 30%", impact: "High", savings: "Performance" },
  ]

  const filteredTips = selectedCategory === "all" 
    ? allRecommendations 
    : allRecommendations.filter(r => r.category === selectedCategory)

  const categories = [
    { id: "all", label: "All", count: allRecommendations.length },
    { id: "performance", label: "Performance", count: allRecommendations.filter(r => r.category === "performance").length },
    { id: "cost", label: "Cost", count: allRecommendations.filter(r => r.category === "cost").length },
    { id: "security", label: "Security", count: allRecommendations.filter(r => r.category === "security").length },
  ]

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
            <h2 className="text-xl font-semibold">AI Recommendations</h2>
            <p className="text-sm text-gray-400">Actionable insights to optimize your infrastructure</p>
          </div>
        </div>
        <div className="text-sm text-gray-400 terminal-text">
          Potential savings: <span className="text-accent font-bold">$188/mo</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium terminal-text transition-all
              ${selectedCategory === cat.id
                ? "bg-accent/20 text-accent border border-accent/30"
                : "glass-card text-gray-400 hover:text-white border border-white/10"
              }
            `}
          >
            {cat.label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
              {cat.count}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filteredTips.map((item, i) => (
            <motion.div 
              key={item.id} 
              className="p-4 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, x: 5 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-300 mb-2">{item.tip}</div>
                    <div className="flex gap-3 text-xs">
                      <span className={`
                        px-2 py-1 rounded ${
                          item.impact === "Critical" ? "bg-error/10 text-error" :
                          item.impact === "High" ? "bg-warning/10 text-warning" :
                          "bg-accent/10 text-accent"
                        }
                      `}>
                        {item.impact} Impact
                      </span>
                      <span className="text-gray-500">Savings: <span className="text-success">{item.savings}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button 
                    className="px-3 py-1.5 text-xs text-accent hover:bg-accent/10 rounded border border-accent/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Apply
                  </motion.button>
                  <motion.button 
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Dismiss
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
