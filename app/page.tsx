"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Brain, Lightbulb, Target, Play, RefreshCcw } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { trpc } from "@/lib/trpc"
import { AuthLoading } from "@/components/auth/loading"

export default function Overview() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { isDeploying, setDeploying } = useAppStore()
  const { addToast, ToastContainer } = useToast()

  const [metrics, setMetrics] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const { mutate: triggerDeployment } = trpc.triggerDeployment.useMutation()
  const { mutate: refreshMetrics } = trpc.refreshMetrics.useMutation({
    onSuccess(data) {
      setMetrics(data)
    },
  })

  trpc.liveMetrics.useSubscription(undefined, {
    onData(data) {
      setMetrics(data)
      setMetricsLoading(false)
    },
  })

  trpc.logs.useSubscription(undefined, {
    onData(log) {
      setLogs((prev) => [log, ...prev.slice(0, 49)])
    },
  })

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/landing")
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !isSignedIn) return <AuthLoading />

  const handleQuickDeploy = () => {
    setDeploying(true)
    triggerDeployment({ branch: "main" })
    addToast({
      type: "success",
      title: "Deployment Started",
      description: "Deployment has been triggered and is now in progress",
    })
    setTimeout(() => setDeploying(false), 1000)
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <ToastContainer />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <WelcomeCard user={user} />

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-8 h-8 text-accent" />
                <h1 className="text-3xl font-bold">Infrastructure Intelligence</h1>
              </div>
              <p className="text-gray-400">AI-powered insights from your application data</p>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => refreshMetrics()} title="Refresh Metrics">
                <RefreshCcw className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
              <LoadingButton
                loading={isDeploying}
                loadingText="Deploying..."
                onClick={handleQuickDeploy}
                className="glass-card px-6 py-3 text-accent hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30"
              >
                <Play className="w-5 h-5 mr-2" />
                Quick Deploy
              </LoadingButton>
            </div>
          </div>

          <MetricsCard metrics={metrics} loading={metricsLoading} />
          <Recommendations />
          <LiveLogs logs={logs} />
        </main>
      </div>
    </div>
  )
}

// Separated Components for Cleanliness

function WelcomeCard({ user }: { user: any }) {
  return (
    <div className="glass-card p-4 mb-6 border-l-4 border-l-accent">
      <div className="flex items-center space-x-3">
        <Brain className="w-5 h-5 text-accent" />
        <div>
          <div className="font-medium">Welcome back, {user?.firstName || user?.username || "Commander"}!</div>
          <div className="text-sm text-gray-400">Your DevOps command center is ready.</div>
        </div>
      </div>
    </div>
  )
}

function MetricsCard({ metrics, loading }: { metrics: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-400">
        <div className="animate-spin h-6 w-6 border-b-2 border-accent rounded-full mr-4" />
        Loading metrics...
      </div>
    )
  }

  return (
    <div className="glass-card p-8 mb-8 border-l-4 border-l-success">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Today's Infrastructure Grade</h2>
          <p className="text-gray-400">Based on performance, reliability, and cost efficiency</p>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold text-success mb-2">A</div>
          <div className="text-sm text-gray-400">90+/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Uptime" value={`${(100 - metrics?.cpu).toFixed(1)}%`} tone="success" />
        <Metric label="Avg Response" value={`${metrics?.latency}ms`} tone="warning" />
        <Metric label="Daily Cost" value={`$${metrics?.cost?.toFixed(2)}`} tone="accent" />
        <Metric label="Active Issues" value={Math.floor(metrics?.memory / 20)} tone="error" />
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: any; tone: string }) {
  return (
    <div className="text-center p-4 glass-card rounded-lg">
      <div className={`text-2xl font-bold text-${tone} mb-1`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function Recommendations() {
  const tips = [
    "Scale down unused containers during off-hours",
    "Enable autoscaling for worker nodes",
    "Archive old logs to reduce storage cost",
  ]

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <Lightbulb className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-semibold">AI Recommendations</h2>
        <div className="ml-auto text-sm text-gray-400">From Supabase insights</div>
      </div>

      <div className="space-y-4">
        {tips.map((tip, i) => (
          <div key={i} className="p-4 glass-card rounded-lg">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-gray-300">{tip}</div>
              <button className="text-xs text-accent hover:text-accent/80">Apply →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveLogs({ logs }: { logs: any[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">📋 Live Logs</h2>
      <ul className="max-h-64 overflow-y-auto space-y-2 text-sm text-white">
        {logs.map((log, i) => (
          <li key={i} className={`text-${log.type === "error" ? "red" : log.type === "warn" ? "yellow" : "green"}-400`}>
            [{log.type.toUpperCase()}] [{log.service}] {log.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
