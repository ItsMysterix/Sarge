"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  detail?: string
  color: string
  delay?: number
}

export function StatCard({ icon: Icon, label, value, detail, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div 
      className="glass-card p-4 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}
      </div>
      {detail && (
        <div className="text-xs text-gray-400 mt-1">
          {detail}
        </div>
      )}
    </motion.div>
  )
}

interface LargeStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  detail?: string
  color: string
  delay?: number
}

export function LargeStatCard({ icon: Icon, label, value, detail, color, delay = 0 }: LargeStatCardProps) {
  return (
    <motion.div 
      className="glass-card p-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${color} mb-2`}>
        {value}
      </div>
      {detail && (
        <div className="text-xs text-gray-400">
          {detail}
        </div>
      )}
    </motion.div>
  )
}
