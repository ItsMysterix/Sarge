"use client"

import { motion } from "framer-motion"
import { Cpu, Database, HardDrive, Zap } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { CPUUsageChart, MemoryUsageChart } from "@/components/ui/metrics-chart"

interface InfrastructureTabProps {
  displayData: any[]
  currentMetrics: any
  avgCpu: number
  avgMemory: number
}

export function InfrastructureTab({ 
  displayData, 
  currentMetrics, 
  avgCpu, 
  avgMemory 
}: InfrastructureTabProps) {
  return (
    <div className="space-y-6">
      {/* Infrastructure Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard size="lg"
          icon={Cpu}
          title="CPU"
          value={`${currentMetrics?.cpu?.toFixed(1) || avgCpu.toFixed(1)}%`}
          detail="4 cores · 3.2 GHz"
          color="text-accent"
        />
        
        <StatCard size="lg"
          icon={Database}
          title="Memory"
          value={`${((avgMemory / 100) * 8).toFixed(1)}GB`}
          detail="of 8GB total"
          color="text-warning"
          delay={0.1}
        />
        
        <StatCard size="lg"
          icon={HardDrive}
          title="Disk I/O"
          value={`${(Math.random() * 100 + 50).toFixed(0)} MB/s`}
          detail="Read: 45 · Write: 32 MB/s"
          color="text-purple-400"
          delay={0.2}
        />
        
        <StatCard size="lg"
          icon={Zap}
          title="Network I/O"
          value={`${(Math.random() * 50 + 20).toFixed(0)} MB/s`}
          detail="In: 28 · Out: 19 MB/s"
          color="text-yellow-400"
          delay={0.3}
        />
      </div>

      {/* Large Infrastructure Charts */}
      <motion.div 
        className="glass-card p-8 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <CPUUsageChart data={displayData} />
      </motion.div>

      <motion.div 
        className="glass-card p-8 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <MemoryUsageChart data={displayData} />
      </motion.div>
    </div>
  )
}
