"use client"

import { motion } from "framer-motion"
import { Cpu, Database, Clock, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { CPUUsageChart, MemoryUsageChart } from "@/components/ui/metrics-chart"

interface OverviewTabProps {
  displayData: any[]
  currentMetrics: any
  avgCpu: number
  avgMemory: number
  avgLatency: number
  totalRequests: number
}

export function OverviewTab({ 
  displayData, 
  currentMetrics, 
  avgCpu, 
  avgMemory, 
  avgLatency,
  totalRequests 
}: OverviewTabProps) {
  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Cpu}
          title="CPU Usage"
          value={`${currentMetrics?.cpu?.toFixed(1) || avgCpu.toFixed(1)}%`}
          detail={`Avg: ${avgCpu.toFixed(1)}% · Peak: ${(displayData?.length > 0 ? Math.max(...displayData.map(d => d.cpu)) : 0).toFixed(1)}%`}
          color="text-accent"
          delay={0.1}
        />
        
        <StatCard
          icon={Database}
          title="Memory"
          value={`${currentMetrics?.memory?.toFixed(1) || avgMemory.toFixed(1)}%`}
          detail={`Avg: ${avgMemory.toFixed(1)}% · Used: ${((avgMemory / 100) * 8).toFixed(1)}GB / 8GB`}
          color="text-warning"
          delay={0.15}
        />
        
        <StatCard
          icon={Clock}
          title="Response Time"
          value={`${currentMetrics?.latency || Math.floor(avgLatency)}ms`}
          detail={`p50: ${Math.floor(avgLatency)}ms · p95: ${Math.floor(avgLatency * 1.5)}ms`}
          color="text-info"
          delay={0.2}
        />
        
        <StatCard
          icon={TrendingUp}
          title="Throughput"
          value={displayData?.length > 0 ? Math.floor(totalRequests / displayData.length) : 0}
          detail={`req/min · ${totalRequests.toLocaleString()} total`}
          color="text-success"
          delay={0.25}
        />
      </div>

      {/* Overview Charts - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          className="glass-card p-6 border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <CPUUsageChart data={displayData} />
        </motion.div>

        <motion.div 
          className="glass-card p-6 border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <MemoryUsageChart data={displayData} />
        </motion.div>
      </div>
    </>
  )
}
