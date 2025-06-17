"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
  Rocket,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  RotateCcw,
  Play,
  Brain,
} from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"
import { useToast } from "@/components/ui/toast"
import { useDeployments } from "@/hooks/useApi"
import { useAppStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"

export default function Deployments() {
  const { data: deployments, loading, triggerDeployment } = useDeployments()
  const { isDeploying, setDeploying } = useAppStore()
  const { addToast, ToastContainer } = useToast()

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      const deployment = await triggerDeployment("main")
      addToast({
        type: "success",
        title: "Deployment Started",
        description: `Deployment ${deployment.id} is now pending`,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />
      case "failed":
        return <XCircle className="w-4 h-4 text-error" />
      case "pending":
        return <Clock className="w-4 h-4 text-warning animate-spin" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-success"
      case "failed":
        return "text-error"
      case "pending":
        return "text-warning"
      default:
        return "text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading deployments...</p>
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
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Rocket className="w-8 h-8 text-accent" />
                <h1 className="text-3xl font-bold">Smart Deployments</h1>
              </div>
              <p className="text-gray-400">Real-time deployment tracking with Supabase</p>
            </div>
            <LoadingButton
              loading={isDeploying}
              loadingText="Deploying..."
              onClick={handleDeploy}
              className="glass-card px-6 py-3 text-accent hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30"
            >
              <Play className="w-5 h-5 mr-2" />
              Deploy Latest
            </LoadingButton>
          </div>

          {/* Intelligence Summary */}
          <div className="glass-card p-6 mb-8 border-l-4 border-l-accent">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Deployment Intelligence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-success mb-1">
                  {deployments.length > 0
                    ? Math.round((deployments.filter((d) => d.status === "success").length / deployments.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-warning mb-1">2.1m</div>
                <div className="text-sm text-gray-400">Avg Duration</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-error mb-1">
                  {deployments.filter((d) => d.status === "failed").length}
                </div>
                <div className="text-sm text-gray-400">Failed Deploys</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-accent mb-1">{deployments.length}</div>
                <div className="text-sm text-gray-400">Total Deploys</div>
              </div>
            </div>
          </div>

          {/* Deployment Timeline */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Recent Deployments</h2>
              <p className="text-sm text-gray-400 mt-1">Live data from Supabase</p>
            </div>

            <div className="divide-y divide-white/5">
              {deployments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Rocket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No deployments found</p>
                </div>
              ) : (
                deployments.map((deploy, i) => (
                  <div key={deploy.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(deploy.status)}
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="terminal-text text-accent font-medium">#{deploy.id.slice(-6)}</span>
                            <div
                              className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(deploy.status)} bg-opacity-10`}
                            >
                              {deploy.status}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatDistanceToNow(new Date(deploy.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-2 glass-card hover:bg-white/10 transition-colors rounded">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 glass-card hover:bg-white/10 transition-colors rounded">
                          <RotateCcw className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mb-3">
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        <span className="terminal-text text-sm">{deploy.branch}</span>
                      </div>
                      <div className="terminal-text text-sm text-gray-400">{deploy.commit}</div>
                    </div>

                    <div className="p-3 glass-card rounded-lg">
                      <div className="text-sm text-gray-300">{deploy.summary}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
