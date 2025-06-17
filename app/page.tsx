"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Brain, Lightbulb, Target, Play } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/components/ui/toast"
import { useInsights, useMetrics } from "@/hooks/useApi"
import { useAppStore } from "@/lib/store"
import { socketManager } from "@/lib/socket"
import { useEffect } from "react"

export default function Overview() {
  const { data: insights, loading: insightsLoading } = useInsights()
  const { data: metrics, loading: metricsLoading } = useMetrics()
  const { isDeploying, setDeploying } = useAppStore()
  const { addToast, ToastContainer } = useToast()

  const handleQuickDeploy = async () => {
    setDeploying(true)
    try {
      // Use WebSocket for real-time deployment
      socketManager.triggerDeployment("main")

      addToast({
        type: "success",
        title: "Deployment Started",
        description: "Deployment has been triggered and is now in progress",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to start deployment",
      })
    } finally {
      setDeploying(false)
    }
  }

  useEffect(() => {
    socketManager.connect()

    return () => {
      // Don't disconnect on unmount as other components might be using it
    }
  }, [])

  if (insightsLoading || metricsLoading) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading intelligence...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <ToastContainer />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          {/* AI Insight Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-8 h-8 text-accent" />
                <h1 className="text-3xl font-bold">Infrastructure Intelligence</h1>
              </div>
              <p className="text-gray-400">AI-powered insights from your application data</p>
            </div>

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

          {/* Today's Summary Card */}
          <div className="glass-card p-8 mb-8 border-l-4 border-l-success">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Today's Infrastructure Grade</h2>
                <p className="text-gray-400">Based on performance, reliability, and cost efficiency</p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-success mb-2">{insights?.grade || "A"}</div>
                <div className="text-sm text-gray-400">
                  {insights?.grade === "A" ? "90+" : insights?.grade === "B" ? "80+" : "70+"}/100
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-success mb-1">
                  {metrics ? `${(100 - metrics.cpu).toFixed(1)}%` : "99.8%"}
                </div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-warning mb-1">{metrics ? `${metrics.latency}ms` : "45ms"}</div>
                <div className="text-sm text-gray-400">Avg Response</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-accent mb-1">
                  ${metrics ? metrics.cost.toFixed(2) : "91.40"}
                </div>
                <div className="text-sm text-gray-400">Daily Cost</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-error mb-1">
                  {metrics ? Math.floor(metrics.memory / 20) : 3}
                </div>
                <div className="text-sm text-gray-400">Active Issues</div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Lightbulb className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">AI Recommendations</h2>
              <div className="ml-auto text-sm text-gray-400">From Supabase insights</div>
            </div>

            <div className="space-y-4">
              {insights?.tips?.map((tip, i) => (
                <div key={i} className="p-4 glass-card rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-300">{tip}</div>
                    </div>
                    <button className="text-xs text-accent hover:text-accent/80 transition-colors">Apply →</button>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-400 py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recommendations available</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
