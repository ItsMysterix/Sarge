"use client"

import { motion } from "framer-motion"
import { Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { MetricsChart, RequestVolumeChart, ErrorRateChart } from "@/components/ui/metrics-chart"

interface PerformanceTabProps {
  displayData: any[]
  avgLatency: number
  totalRequests: number
  errorRate: number
  totalErrors: number
}

export function PerformanceTab({ 
  displayData, 
  avgLatency, 
  totalRequests,
  errorRate,
  totalErrors
}: PerformanceTabProps) {
  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard size="lg"
          icon={Clock}
          title="Response Latency"
          value={`${Math.floor(avgLatency)}ms`}
          detail={`p50: ${Math.floor(avgLatency)}ms · p95: ${Math.floor(avgLatency * 1.5)}ms · p99: ${Math.floor(avgLatency * 2)}ms`}
          color="text-info"
        />
        
        <StatCard size="lg"
          icon={TrendingUp}
          title="Request Volume"
          value={`${Math.floor(totalRequests / displayData.length)}/min`}
          detail={`Total: ${totalRequests.toLocaleString()} · Avg: ${(totalRequests / displayData.length).toFixed(1)}/min`}
          color="text-success"
          delay={0.1}
        />
        
        <StatCard size="lg"
          icon={AlertTriangle}
          title="Error Rate"
          value={`${errorRate.toFixed(2)}%`}
          detail={`${totalErrors} errors · ${(totalErrors / (displayData.length || 1)).toFixed(1)}/min`}
          color="text-error"
          delay={0.2}
        />
      </div>

      {/* Large Performance Charts */}
      <motion.div 
        className="glass-card p-8 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <MetricsChart
          data={displayData}
          type="line"
          dataKey="latency"
          xAxisKey="time"
          title="Response Latency Over Time"
          color="#00d4ff"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          className="glass-card p-8 border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <RequestVolumeChart data={displayData} />
        </motion.div>

        <motion.div 
          className="glass-card p-8 border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
        >
          <ErrorRateChart data={displayData} />
        </motion.div>
      </div>
    </div>
  )
}
