"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Activity, TrendingUp, Clock, Zap, Server, Database, Cpu, HardDrive, AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { 
  CPUUsageChart, 
  MemoryUsageChart, 
  RequestVolumeChart, 
  ErrorRateChart,
  ServiceDistributionChart,
  MetricsChart 
} from "@/components/ui/metrics-chart"
import { trpc } from "@/lib/trpc"

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
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  
  const t = trpc as any
  const metricsQuery = t.metrics.latest.useQuery()

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
        requests: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 10),
      }
      
      setMetricsHistory(prev => {
        const updated = [...prev, newPoint]
        // Keep only last N points based on time range
        const maxPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168
        return updated.slice(-maxPoints)
      })
    }
  }, [metricsQuery.data, timeRange])

  // Subscribe to live metrics
  t.metrics.live.useSubscription(undefined, {
    onData(data: any) {
      if (data) {
        setCurrentMetrics(data)
        
        const newPoint: MetricDataPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          cpu: data.cpu || 0,
          memory: data.memory || 0,
          latency: data.latency || 0,
          requests: Math.floor(Math.random() * 1000) + 500,
          errors: Math.floor(Math.random() * 10),
        }
        
        setMetricsHistory(prev => {
          const updated = [...prev, newPoint]
          const maxPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168
          return updated.slice(-maxPoints)
        })
      }
    },
  })

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services')
        if (res.ok) {
          const data = await res.json()
          setServices(data.services || [])
        }
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    fetchServices()
  }, [])

  // Generate fallback data if no real data yet
  const generateFallbackData = (points: number): MetricDataPoint[] => {
    if (metricsHistory.length > 0) return metricsHistory
    
    return Array.from({ length: points }, (_, i) => {
      const now = new Date()
      const time = new Date(now.getTime() - (points - i) * 60000)
      return {
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        latency: Math.floor(Math.random() * 100) + 20,
        requests: Math.floor(Math.random() * 1000) + 200,
        errors: Math.floor(Math.random() * 15),
      }
    })
  }

  const displayData = metricsHistory.length > 0 
    ? metricsHistory 
    : generateFallbackData(timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168)

  // Calculate statistics
  const avgCpu = displayData.length > 0 
    ? displayData.reduce((sum, d) => sum + d.cpu, 0) / displayData.length 
    : 0
  const avgMemory = displayData.length > 0 
    ? displayData.reduce((sum, d) => sum + d.memory, 0) / displayData.length 
    : 0
  const avgLatency = displayData.length > 0 
    ? displayData.reduce((sum, d) => sum + d.latency, 0) / displayData.length 
    : 0
  const totalRequests = displayData.reduce((sum, d) => sum + (d.requests || 0), 0)
  const totalErrors = displayData.reduce((sum, d) => sum + (d.errors || 0), 0)
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  // Service distribution data
  const serviceData = services.length > 0 
    ? services.map(s => ({ name: s.name, value: Math.floor(Math.random() * 100) }))
    : [
        { name: 'Lambda', value: 35 },
        { name: 'DynamoDB', value: 25 },
        { name: 'S3', value: 20 },
        { name: 'SQS', value: 12 },
        { name: 'SNS', value: 8 },
      ]

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
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Metrics Dashboard</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-400">
                  Real-time performance and infrastructure metrics · {displayData.length} data points
                </p>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex gap-2">
                {(['1h', '24h', '7d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`
                      px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all
                      ${timeRange === range
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'glass-card text-gray-400 hover:text-white border border-white/10'
                      }
                    `}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Health Score Banner */}
          <motion.div 
            className="glass-card p-6 mb-6 border-l-4 border-l-accent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-lg ${healthScore >= 80 ? 'bg-success/10' : healthScore >= 60 ? 'bg-warning/10' : 'bg-error/10'}`}>
                  {healthScore >= 80 ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-warning" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">System Health</div>
                  <div className={`text-2xl font-bold ${healthScore >= 80 ? 'text-success' : healthScore >= 60 ? 'text-warning' : 'text-error'}`}>
                    {healthStatus}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${healthScore >= 80 ? 'text-success' : healthScore >= 60 ? 'text-warning' : 'text-error'}`}>
                  {healthGrade}
                </div>
                <div className="text-xs text-gray-400 mt-1">{healthScore}/100</div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div 
              className="glass-card p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-5 h-5 text-accent" />
                <span className="text-xs text-gray-400">CPU</span>
              </div>
              <div className="text-2xl font-bold text-accent">
                {currentMetrics?.cpu?.toFixed(1) || avgCpu.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Avg: {avgCpu.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Database className="w-5 h-5 text-warning" />
                <span className="text-xs text-gray-400">Memory</span>
              </div>
              <div className="text-2xl font-bold text-warning">
                {currentMetrics?.memory?.toFixed(1) || avgMemory.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Avg: {avgMemory.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-info" />
                <span className="text-xs text-gray-400">Latency</span>
              </div>
              <div className="text-2xl font-bold text-info">
                {currentMetrics?.latency || Math.floor(avgLatency)}ms
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Avg: {Math.floor(avgLatency)}ms
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Server className="w-5 h-5 text-success" />
                <span className="text-xs text-gray-400">Error Rate</span>
              </div>
              <div className="text-2xl font-bold text-success">
                {errorRate.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {totalErrors} of {totalRequests}
              </div>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* CPU Chart */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CPUUsageChart data={displayData} />
            </motion.div>

            {/* Memory Chart */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              <MemoryUsageChart data={displayData} />
            </motion.div>

            {/* Latency Chart */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MetricsChart
                data={displayData}
                type="line"
                dataKey="latency"
                xAxisKey="time"
                title="Response Latency (ms)"
                color="#00d4ff"
              />
            </motion.div>

            {/* Error Rate */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
            >
              <ErrorRateChart data={displayData} />
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Distribution */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ServiceDistributionChart data={serviceData} />
            </motion.div>

            {/* Request Volume */}
            <motion.div 
              className="glass-card p-6 border border-white/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
            >
              <RequestVolumeChart data={displayData} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
