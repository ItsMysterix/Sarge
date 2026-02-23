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
  accent: { icon: "text-foreground", bg: "bg-foreground/10", border: "border-foreground/20" },
  success: { icon: "text-foreground", bg: "bg-foreground/10", border: "border-foreground/20" },
  warning: { icon: "text-muted-foreground", bg: "bg-muted/30", border: "border-muted-foreground/20" },
  error: { icon: "text-muted-foreground", bg: "bg-muted/30", border: "border-muted-foreground/20" },
}

import CountUp from "react-countup"

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
  const colors = isNamedColor || { icon: "text-foreground", bg: "bg-foreground/5", border: "border-foreground/10" }
  const isClickable = !!onClick

  // Try to parse string values like "$4,200", "500ms" to animate them. 
  // If it's pure number, animate it directly
  let renderValue: React.ReactNode = value
  if (typeof value === "number") {
    renderValue = <CountUp end={value} duration={2} separator="," />
  } else if (typeof value === "string") {
    const numMatch = value.match(/^([^\d]*)?([\d,.]+)([^\d]*)?$/)
    if (numMatch) {
      const prefix = numMatch[1] || ""
      const numValue = parseFloat(numMatch[2].replace(/,/g, ""))
      const suffix = numMatch[3] || ""
      if (!isNaN(numValue)) {
        renderValue = <CountUp end={numValue} duration={2} separator="," prefix={prefix} suffix={suffix} decimals={numValue % 1 !== 0 ? 2 : 0} />
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={isClickable ? { y: -4, scale: 1.02 } : {}}
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border backdrop-blur-sm bg-card transition-all duration-300",
        colors.border,
        isClickable && "cursor-pointer hover:bg-muted/50",
        size === "lg" && "p-6"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.icon, size === "lg" && "w-6 h-6")} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs text-muted-foreground")}>
            {trend.direction === "up" ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            <span className={cn("font-mono", trend.direction === "up" ? "text-green-500" : "text-red-500")}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className={cn("font-bold terminal-text", size === "lg" ? "text-3xl" : "text-2xl")}>{renderValue}</div>
        <div className="text-xs text-gray-400">{title}</div>
        {(subtitle || detail) && (
          <div className="text-xs text-gray-500 terminal-text">{subtitle || detail}</div>
        )}
      </div>
    </motion.div>
  )
}
