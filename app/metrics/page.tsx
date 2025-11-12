"use client"
export const dynamic = 'force-dynamic'

import { AppShell } from "@/components/layout/app-shell"
import { PageTitle } from '@/components/layout/page-title';
import { Rocket, Cpu, Server, Gauge } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
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
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h')
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'infrastructure' | 'services'>('overview')
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [workspaceHealth, setWorkspaceHealth] = useState<any[]>([])
  
  const t = trpc as any
  const metricsQuery = t.metrics.latest.useQuery(undefined, {
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  })
  const servicesSummaryQuery = t.sarge.metrics.getServicesSummary.useQuery()
  const workspaceHealthQuery = t.sarge.metrics.getWorkspaceHealth.useQuery({})
  
  // Check if we have any real data (kept for potential future use)
  const hasData = metricsHistory.length > 0 || services.length > 0 || workspaceHealth.length > 0

  // Fetch workspace health data
  useEffect(() => {
    if (workspaceHealthQuery.data) {
      setWorkspaceHealth(Array.isArray(workspaceHealthQuery.data) ? workspaceHealthQuery.data : [workspaceHealthQuery.data])
    }
  }, [workspaceHealthQuery.data])

  // Fetch services summary
  useEffect(() => {
    if (servicesSummaryQuery.data && Array.isArray(servicesSummaryQuery.data)) {
      setServices(servicesSummaryQuery.data)
    }
  }, [servicesSummaryQuery.data])

  // Fetch initial data
  useEffect(() => {
    if (metricsQuery.data) {
      setCurrentMetrics(metricsQuery.data)
      
      // Add to history
      const newPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        cpu: metricsQuery.data.cpu || 0,
        memory: metricsQuery.data.memory || 0,
        latency: metricsQuery.data.latency || 0,
        requests: 0, // Will be aggregated from service metrics
        errors: 0,
      }
      
      setMetricsHistory(prev => {
        const updated = [...prev, newPoint]
        // Keep only last N points based on time range
        const maxPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168
        return updated.slice(-maxPoints)
      })
    }
  }, [metricsQuery.data, timeRange])

  // Poll for latest metrics to simulate live updates without WebSockets
  useEffect(() => {
    if (metricsQuery.data) {
      const data = metricsQuery.data
      setCurrentMetrics(data)
      const newPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        cpu: data.cpu_percent || data.cpu || 0,
        memory: data.memory_mb || data.memory || 0,
        latency: data.avg_response_ms || data.latency || 0,
        requests: data.request_count || 0,
        errors: data.error_count || 0,
      }
      setMetricsHistory(prev => {
        const updated = [...prev, newPoint]
        const maxPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168
        return updated.slice(-maxPoints)
      })
    }
  }, [metricsQuery.data, timeRange])

  // Derive services data from real metrics via tRPC only
  useEffect(() => {
    if (servicesSummaryQuery.data && servicesSummaryQuery.data.length > 0) {
      setServices(servicesSummaryQuery.data.map((metric: any) => ({
        name: metric.service_name,
        status: metric.status,
        port: metric.port,
        avgCpu: parseFloat(metric.avg_cpu || 0),
        avgMemory: parseFloat(metric.avg_memory || 0),
        totalRequests: parseInt(metric.total_requests || 0),
        totalErrors: parseInt(metric.total_errors || 0),
        avgResponse: parseFloat(metric.avg_response || 0),
      })))
    }
  }, [servicesSummaryQuery.data])

  // Calculate statistics from real data only
  const avgCpu = metricsHistory.length > 0 
    ? metricsHistory.reduce((sum, d) => sum + d.cpu, 0) / metricsHistory.length 
    : 0
  const avgMemory = metricsHistory.length > 0 
    ? metricsHistory.reduce((sum, d) => sum + d.memory, 0) / metricsHistory.length 
    : 0
  const avgLatency = metricsHistory.length > 0 
    ? metricsHistory.reduce((sum, d) => sum + d.latency, 0) / metricsHistory.length 
    : 0
  const totalRequests = metricsHistory.reduce((sum, d) => sum + (d.requests || 0), 0)
  const totalErrors = metricsHistory.reduce((sum, d) => sum + (d.errors || 0), 0)
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  // Service distribution data from real metrics only
  const serviceData = services.length > 0 
    ? services.map(s => ({ 
        name: s.service_name || s.name, 
        value: s.total_requests || s.avgCpu || 0
      }))
    : workspaceHealth.length > 0
    ? workspaceHealth.map(w => ({
        name: w.workspace_name || 'Workspace',
        value: w.active_services || 0
      }))
    : []

  // Health score calculation
  const calculateHealthScore = () => {
    const cpuScore = Math.max(0, 100 - avgCpu)
    const memScore = Math.max(0, 100 - avgMemory)
    const latencyScore = Math.max(0, 100 - (avgLatency / 2))
    const errorScore = Math.max(0, 100 - (errorRate * 10))
    
    return Math.floor((cpuScore + memScore + latencyScore + errorScore) / 4)
  }

  const healthScore = calculateHealthScore()
  const healthGrade = healthScore >= 90 ? 'A+' : healthScore >= 80 ? 'A' : healthScore >= 70 ? 'B' : healthScore >= 60 ? 'C' : 'D'
  const healthStatus = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Poor'

  return (
    <AppShell>
      <motion.main 
        className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <PageTitle
          title="Metrics"
          description="System performance and usage metrics"
          icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
        />
        {/* Quick Stats - Always show even with empty state */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <QuickStatCard
            title="CPU"
            value={`${currentMetrics?.cpu_percent || currentMetrics?.cpu || 0}%`}
            icon={Cpu}
            subtitle="Avg usage"
            color="warning"
            delay={0}
          />
          <QuickStatCard
            title="Memory"
            value={`${currentMetrics?.memory_mb || currentMetrics?.memory || 0}MB`}
            icon={Gauge}
            subtitle="Working set"
            color="accent"
            delay={0.1}
          />
          <QuickStatCard
            title="Latency"
            value={`${currentMetrics?.avg_response_ms || currentMetrics?.latency || 0}ms`}
            icon={Rocket}
            subtitle="P95 response"
            color="success"
            delay={0.2}
          />
          <QuickStatCard
            title="Services"
            value={services.length.toString()}
            icon={Server}
            subtitle="Tracked" 
            color="accent"
            delay={0.3}
          />
        </motion.div>

        {/* Main content (visible even if there's no data) */}
        <>
            {/* Health Score Banner - Only on Overview */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-6"
              >
                <HealthBanner 
                  healthScore={healthScore} 
                  healthStatus={healthStatus} 
                  healthGrade={healthGrade} 
                />
              </motion.div>
            )}

            {/* Time Range Selector + Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
            >
              <div className="flex gap-2">
                {(['1h', '24h', '7d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'glass-card text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex-1 sm:flex-none">
                <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  displayData={metricsHistory}
                  currentMetrics={currentMetrics}
                  avgCpu={avgCpu}
                  avgMemory={avgMemory}
                  avgLatency={avgLatency}
                  totalRequests={totalRequests}
                />
              )}

              {activeTab === 'performance' && (
                <PerformanceTab
                  displayData={metricsHistory}
                  avgLatency={avgLatency}
                  totalRequests={totalRequests}
                  errorRate={errorRate}
                  totalErrors={totalErrors}
                />
              )}

              {activeTab === 'infrastructure' && (
                <InfrastructureTab
                  displayData={metricsHistory}
                  currentMetrics={currentMetrics}
                  avgCpu={avgCpu}
                  avgMemory={avgMemory}
                />
              )}

              {activeTab === 'services' && (
                <ServicesTab
                  services={services}
                  serviceData={serviceData}
                />
              )}
            </motion.div>
          </>
        
        {/* Build Version Indicator */}
        <div className="fixed bottom-2 right-2 text-[10px] text-zinc-600 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
          Build: {BUILD_INFO.buildId.slice(-8)} | {new Date(BUILD_INFO.timestamp).toLocaleTimeString()}
        </div>
      </motion.main>
    </AppShell>
  )
}
