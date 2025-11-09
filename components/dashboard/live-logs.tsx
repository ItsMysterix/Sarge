'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'

interface LiveLogsProps {
  logs: any[]
}

export function LiveLogs({ logs }: LiveLogsProps) {
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "info">("all")
  const [isPaused, setIsPaused] = useState(false)

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.type === filter)

  const logCounts = {
    all: logs.length,
    error: logs.filter(l => l.type === "error").length,
    warn: logs.filter(l => l.type === "warn").length,
    info: logs.filter(l => l.type === "info").length,
  }

  return (
    <motion.div 
      className="glass-card p-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isPaused ? 0 : 360 }}
            transition={{ repeat: isPaused ? 0 : Infinity, duration: 2, ease: "linear" }}
          >
            <Activity className="w-5 h-5 text-accent" />
          </motion.div>
          <h2 className="text-xl font-semibold">Live Logs</h2>
          <StatusBadge 
            status={isPaused ? "pending" : "running"} 
            label={isPaused ? "Paused" : "Live"} 
            size="sm" 
          />
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1.5 text-xs text-accent hover:bg-accent/10 rounded border border-accent/30"
          >
            {isPaused ? "Resume" : "Pause"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
          >
            View All →
          </motion.button>
        </div>
      </div>

      {/* Log Type Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "error", "warn", "info"] as const).map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(type)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium terminal-text transition-all
              ${filter === type
                ? "bg-accent/20 text-accent border border-accent/30"
                : "glass-card text-gray-400 hover:text-white border border-white/10"
              }
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === type ? "bg-accent/20" : "bg-white/10"
            }`}>
              {logCounts[type]}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              No {filter !== "all" ? filter : ""} logs to display
            </motion.div>
          ) : (
            filteredLogs.slice(0, 10).map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className={`
                  p-3 glass-card rounded text-sm border-l-2 hover:bg-white/5 transition-all
                  ${log.type === "error" ? "border-l-error" : 
                    log.type === "warn" ? "border-l-warning" : 
                    "border-l-success"}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium terminal-text
                    ${log.type === "error" ? "bg-error/10 text-error" : 
                      log.type === "warn" ? "bg-warning/10 text-warning" : 
                      "bg-success/10 text-success"}
                  `}>
                    {log.type?.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-xs">[{log.service}]</span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                  <Clock className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
