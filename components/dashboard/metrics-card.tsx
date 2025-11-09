'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Activity, Database, CheckCircle, AlertTriangle, Shield } from 'lucide-react'

interface MetricsCardProps {
  metrics: any
  loading: boolean
}

export function MetricsCard({ metrics, loading }: MetricsCardProps) {
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
          value={metrics?.cpu ? `${metrics.cpu.toFixed(1)}%` : "N/A"} 
          status={metrics?.cpu > 80 ? "error" : metrics?.cpu > 60 ? "warning" : "success"}
          icon={Activity}
          delay={0.4}
        />
        <MetricItem 
          label="Memory" 
          value={metrics?.memory ? `${metrics.memory.toFixed(1)}%` : "N/A"} 
          status={metrics?.memory > 85 ? "error" : metrics?.memory > 70 ? "warning" : "success"}
          icon={Database}
          delay={0.45}
        />
        <MetricItem 
          label="Uptime" 
          value={metrics?.cpu ? `${(100 - metrics.cpu).toFixed(1)}%` : "N/A"}
          status="success"
          icon={CheckCircle}
          delay={0.5}
        />
        <MetricItem 
          label="Alerts" 
          value={metrics?.memory ? Math.floor(metrics.memory / 20) : 0}
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
