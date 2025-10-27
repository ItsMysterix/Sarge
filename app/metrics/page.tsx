"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Activity, TrendingUp, Clock, Zap } from "lucide-react"
import { motion } from "framer-motion"

export default function MetricsPage() {
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
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Metrics</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">
              Real-time performance data from your workspace—CPU, memory, latency, throughput
            </p>
          </motion.div>

          {/* Placeholder content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 glass-card rounded-full border border-accent/30">
                <Activity className="w-12 h-12 text-accent animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Metrics Dashboard</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Prometheus-compatible metrics from all services in your workspace. 
              Charts and visualizations scoped by Stack or Service.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="glass-card p-6 border border-white/5 rounded text-left">
                <TrendingUp className="w-6 h-6 text-accent mb-3" />
                <div className="text-2xl font-bold mb-1">98.5%</div>
                <div className="text-sm text-gray-400">Uptime (7d)</div>
              </div>
              <div className="glass-card p-6 border border-white/5 rounded text-left">
                <Clock className="w-6 h-6 text-accent mb-3" />
                <div className="text-2xl font-bold mb-1">45ms</div>
                <div className="text-sm text-gray-400">Avg Latency</div>
              </div>
              <div className="glass-card p-6 border border-white/5 rounded text-left">
                <Zap className="w-6 h-6 text-accent mb-3" />
                <div className="text-2xl font-bold mb-1">1.2k/s</div>
                <div className="text-sm text-gray-400">Requests/sec</div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
