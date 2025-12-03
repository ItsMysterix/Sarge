"use client"
export const dynamic = "force-dynamic"

import { AppShell } from "../../components/layout/app-shell"
import { PageTitle } from "@/components/layout/page-title"
import { Rocket, Cpu, Server, Gauge, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { HealthBanner } from "@/components/metrics/health-banner"
import { QuickStatCard } from "@/components/ui/quick-stat-card"
import { TabsNavigation } from "@/components/metrics/tabs-navigation"
import { OverviewTab } from "@/components/metrics/overview-tab"
import { PerformanceTab } from "@/components/metrics/performance-tab"
import { InfrastructureTab } from "@/components/metrics/infrastructure-tab"
import { ServicesTab } from "@/components/metrics/services-tab"
import { BUILD_INFO } from "@/lib/build-info"

interface MetricDataPoint {
  time: string
  cpu: number
  memory: number
  latency: number
  requests?: number
  errors?: number
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "infrastructure" | "services"
  >("overview")
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [workspaceHealth, setWorkspaceHealth] = useState<any[]>([])

  // ---- derived metrics ----
  const avgCpu =
    metricsHistory.length > 0
      ? metricsHistory.reduce((sum, m) => sum + (m.cpu || 0), 0) /
        metricsHistory.length
      : 0

  const avgMemory =
    metricsHistory.length > 0
      ? metricsHistory.reduce((sum, m) => sum + (m.memory || 0), 0) /
        metricsHistory.length
      : 0

  const avgLatency =
    metricsHistory.length > 0
      ? metricsHistory.reduce((sum, m) => sum + (m.latency || 0), 0) /
        metricsHistory.length
      : 0

  const totalRequests = metricsHistory.reduce(
    (sum, m) => sum + (m.requests || 0),
    0
  )
  const totalErrors = metricsHistory.reduce(
    (sum, m) => sum + (m.errors || 0),
    0
  )
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  const serviceData =
    workspaceHealth.length > 0
      ? workspaceHealth.map((w: any) => ({
          name: w.workspace_name || "Workspace",
          value: w.active_services || 0,
        }))
      : []

  const calculateHealthScore = () => {
    const cpuScore = Math.max(0, 100 - avgCpu)
    const memScore = Math.max(0, 100 - avgMemory)
    const latencyScore = Math.max(0, 100 - avgLatency / 2)
    const errorScore = Math.max(0, 100 - errorRate)

    return Math.floor((cpuScore + memScore + latencyScore + errorScore) / 4)
  }

  const healthScore = calculateHealthScore()
  const healthGrade =
    healthScore >= 90
      ? "A+"
      : healthScore >= 80
      ? "A"
      : healthScore >= 70
      ? "B"
      : healthScore >= 60
      ? "C"
      : "D"
  const healthStatus =
    healthScore >= 80
      ? "Excellent"
      : healthScore >= 60
      ? "Good"
      : healthScore >= 40
      ? "Fair"
      : "Poor"

  const hasNoData =
    !metricsHistory.length && !services.length && !workspaceHealth.length

  return (
    <AppShell>
      <main className="flex-1 p-3 sm:p-4 md:p-6 w-full max-w-[100vw]">
        <PageTitle
          title="Metrics"
          description="System performance and usage metrics"
          icon={
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />
          }
          className="mb-6"
        />

        {hasNoData ? (
          <div className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg mx-auto max-w-xl">
            <div className="flex justify-center mb-6">
              <div className="p-4 glass-card rounded-full border border-accent/30">
                <Gauge className="w-12 h-12 text-accent" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              No metrics available yet
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Metrics will appear after you deploy, analyze, or interact with
              your services. Connect a repository or trigger a deployment to
              start collecting performance data.
            </p>
            <a
              href="/deployments"
              className="px-6 py-3 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center mx-auto backdrop-blur-sm"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Go to Deployments
            </a>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <QuickStatCard
                title="CPU"
                value={`${currentMetrics?.cpu_percent ?? currentMetrics?.cpu ?? avgCpu.toFixed(1)}%`}
                icon={Cpu}
                subtitle="Avg usage"
                color="warning"
                delay={0}
              />
              <QuickStatCard
                title="Memory"
                value={`${currentMetrics?.memory_mb ?? currentMetrics?.memory ?? avgMemory.toFixed(0)}MB`}
                icon={Gauge}
                subtitle="Working set"
                color="accent"
                delay={0.1}
              />
              <QuickStatCard
                title="Latency"
                value={`${currentMetrics?.avg_response_ms ?? currentMetrics?.latency ?? avgLatency.toFixed(0)}ms`}
                icon={Server}
                subtitle="Avg response"
                color="success"
                delay={0.2}
              />
              <QuickStatCard
                title="Errors"
                value={totalErrors.toString()}
                icon={Rocket}
                subtitle="Total errors"
                color="error"
                delay={0.3}
              />
            </motion.div>

            {/* Health Banner on Overview */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-6"
              >
                <HealthBanner
                  healthScore={healthScore}
                  healthGrade={healthGrade}
                  healthStatus={healthStatus}
                />
              </motion.div>
            )}

            {/* Time range + Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
            >
              <div className="flex gap-2">
                {(["1h", "24h", "7d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                      timeRange === range
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "glass-card text-gray-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex-1 sm:flex-none">
                <TabsNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            </motion.div>

            {/* Tab content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {activeTab === "overview" && (
                <OverviewTab
                  displayData={metricsHistory}
                  currentMetrics={currentMetrics}
                  avgCpu={avgCpu}
                  avgMemory={avgMemory}
                  avgLatency={avgLatency}
                  totalRequests={totalRequests}
                />
              )}
              {activeTab === "performance" && (
                <PerformanceTab
                  displayData={metricsHistory}
                  avgLatency={avgLatency}
                  totalRequests={totalRequests}
                  errorRate={errorRate}
                  totalErrors={totalErrors}
                />
              )}
              {activeTab === "infrastructure" && (
                <InfrastructureTab
                  {...({
                    displayData: metricsHistory,
                    currentMetrics,
                    avgCpu,
                    avgMemory,
                    workspaceHealth,
                    serviceData,
                  } as any)}
                />
              )}
              {activeTab === "services" && (
                <ServicesTab services={services} serviceData={serviceData} />
              )}
            </motion.div>
          </>
        )}

        {/* Build Version Indicator */}
        <div className="fixed bottom-2 right-2 text-[10px] text-zinc-600 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
          Build: {BUILD_INFO.buildId.slice(-8)} |{" "}
          {new Date(BUILD_INFO.timestamp).toLocaleTimeString()}
        </div>
      </main>
    </AppShell>
  )
}
