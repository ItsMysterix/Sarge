"use client"

import { motion } from "framer-motion"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface HealthBannerProps {
  healthScore: number
  healthStatus: string
  healthGrade: string
}

export function HealthBanner({ healthScore, healthStatus, healthGrade }: HealthBannerProps) {
  return (
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
  )
}
