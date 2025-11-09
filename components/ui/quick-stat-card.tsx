"use client"

import { motion } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface QuickStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    direction: "up" | "down"
  }
  subtitle?: string
  color?: "accent" | "success" | "warning" | "error"
  onClick?: () => void
  delay?: number
}

const colorConfig = {
  accent: {
    icon: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/30",
    glow: "hover:glow-accent"
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
  },
  warning: {
    icon: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
  },
  error: {
    icon: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
    glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
  }
}

export function QuickStatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = "accent",
  onClick,
  delay = 0
}: QuickStatCardProps) {
  const colors = colorConfig[color]
  const isClickable = !!onClick

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={isClickable ? { y: -4, scale: 1.02 } : {}}
      onClick={onClick}
      className={`
        p-4 rounded-lg border ${colors.border}
        bg-gradient-to-br from-white/[0.07] to-white/[0.03]
        backdrop-blur-sm
        ${isClickable ? `cursor-pointer hover:bg-accent/20 ${colors.glow} transition-all duration-300` : ""}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend.direction === "up" ? "text-success" : "text-error"
          }`}>
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="font-mono">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold terminal-text">{value}</div>
        <div className="text-xs text-gray-400">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 terminal-text">{subtitle}</div>
        )}
      </div>
    </motion.div>
  )
}
