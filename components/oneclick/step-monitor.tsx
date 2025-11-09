'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Cpu, 
  HardDrive, 
  Zap,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StepMonitorProps {
  projectId: string
  onStartOver: () => void
}

export function StepMonitor({ projectId, onStartOver }: StepMonitorProps) {
  const router = useRouter()
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    requests: 124,
    uptime: 100,
  })

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 30) + 40,
        memory: Math.floor(Math.random() * 20) + 50,
        requests: Math.floor(Math.random() * 50) + 100,
        uptime: 100,
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleViewDashboard = () => {
    router.push('/')
  }

  const handleViewProject = () => {
    router.push(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Deployment Successful! 🎉</h2>
        <p className="text-gray-400">
          Your application is now running on localhost and being monitored in real-time.
        </p>
      </div>

      {/* Real-time Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Live Metrics
          </h3>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="p-4 glass-card border border-white/10 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold">{metrics.cpu}%</span>
            </div>
            <p className="text-sm text-gray-400">CPU Usage</p>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-500"
                animate={{ width: `${metrics.cpu}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="p-4 glass-card border border-white/10 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold">{metrics.memory}%</span>
            </div>
            <p className="text-sm text-gray-400">Memory Usage</p>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                animate={{ width: `${metrics.memory}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="p-4 glass-card border border-white/10 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold">{metrics.requests}</span>
            </div>
            <p className="text-sm text-gray-400">Requests/min</p>
          </motion.div>

          <motion.div
            className="p-4 glass-card border border-white/10 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold">{metrics.uptime}%</span>
            </div>
            <p className="text-sm text-gray-400">Uptime</p>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleViewDashboard}
          className="p-4 glass-card border border-white/10 rounded-lg hover:border-blue-500/50 transition-all group"
        >
          <Activity className="h-8 w-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold mb-1">View Dashboard</h4>
          <p className="text-sm text-gray-400">See all metrics and logs</p>
        </button>

        <button
          onClick={handleViewProject}
          className="p-4 glass-card border border-white/10 rounded-lg hover:border-purple-500/50 transition-all group"
        >
          <ExternalLink className="h-8 w-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold mb-1">Project Settings</h4>
          <p className="text-sm text-gray-400">Configure your project</p>
        </button>

        <button
          onClick={onStartOver}
          className="p-4 glass-card border border-white/10 rounded-lg hover:border-green-500/50 transition-all group"
        >
          <RefreshCw className="h-8 w-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold mb-1">Deploy Another</h4>
          <p className="text-sm text-gray-400">Start a new deployment</p>
        </button>
      </div>

      {/* Success Tips */}
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h4 className="font-semibold text-green-400 mb-2">🎉 What's Next?</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Your application is now accessible at the configured ports</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Real-time metrics are being collected and analyzed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>View detailed logs and performance data in the dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Configure environment variables and settings anytime</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
