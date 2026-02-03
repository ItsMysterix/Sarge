"use client"

import { motion } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  detail?: string
  trend?: {
    value: number
    direction: "up" | "down"
  }
  color?: "accent" | "success" | "warning" | "error" | string
  onClick?: () => void
  delay?: number
  size?: "sm" | "default" | "lg"
}

const colorMap: Record<string, any> = {
  accent: { icon: "text-accent", bg: "bg-accent/10", border: "border-accent/30" },
  success: { icon: "text-success", bg: "bg-success/10", border: "border-success/30" },
  warning: { icon: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  error: { icon: "text-error", bg: "bg-error/10", border: "border-error/30" },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  detail,
  trend,
  color = "accent",
  onClick,
  delay = 0,
  size = "default"
}: StatCardProps) {
  const isNamedColor = colorMap[color]
  const colors = isNamedColor || { icon: color, bg: "bg-white/5", border: "border-white/10" }
  const isClickable = !!onClick

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={isClickable ? { y: -4, scale: 1.02 } : {}}
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border backdrop-blur-sm bg-gradient-to-br from-white/[0.07] to-white/[0.03] transition-all duration-300",
        colors.border,
        isClickable && "cursor-pointer hover:bg-white/10",
        size === "lg" && "p-6"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.icon, size === "lg" && "w-6 h-6")} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs", trend.direction === "up" ? "text-success" : "text-error")}>
            {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="font-mono">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className={cn("font-bold terminal-text", size === "lg" ? "text-3xl" : "text-2xl")}>{value}</div>
        <div className="text-xs text-gray-400">{title}</div>
        {(subtitle || detail) && (
          <div className="text-xs text-gray-500 terminal-text">{subtitle || detail}</div>
        )}
      </div>
    </motion.div>
  )
}
