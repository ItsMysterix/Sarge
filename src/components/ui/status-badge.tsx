"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, Clock, Zap, Loader2 } from "lucide-react"

type StatusType = "success" | "error" | "warning" | "pending" | "running" | "failed"

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  animated?: boolean
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    label: "Success"
  },
  error: {
    icon: XCircle,
    color: "text-error",
    bgColor: "bg-error/10",
    borderColor: "border-error/30",
    label: "Error"
  },
  failed: {
    icon: XCircle,
    color: "text-error",
    bgColor: "bg-error/10",
    borderColor: "border-error/30",
    label: "Failed"
  },
  warning: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    label: "Warning"
  },
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
    borderColor: "border-gray-400/30",
    label: "Pending"
  },
  running: {
    icon: Loader2,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    label: "Running"
  }
}

const sizeConfig = {
  sm: { text: "text-xs", padding: "px-2 py-0.5", icon: "w-3 h-3" },
  md: { text: "text-sm", padding: "px-3 py-1.5", icon: "w-4 h-4" },
  lg: { text: "text-base", padding: "px-4 py-2", icon: "w-5 h-5" }
}

export function StatusBadge({ 
  status, 
  label, 
  animated = true, 
  size = "md",
  showIcon = true 
}: StatusBadgeProps) {
  const statusLower = status.toLowerCase() as StatusType
  const config = statusConfig[statusLower] || statusConfig.pending
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon
  const displayLabel = label || config.label

  const Badge = (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.bgColor} ${config.borderColor} ${config.color}
        ${sizeStyles.padding} ${sizeStyles.text}
        font-medium terminal-text
      `}
    >
      {showIcon && (
        <Icon className={`${sizeStyles.icon} ${statusLower === "running" ? "animate-spin" : ""}`} />
      )}
      {displayLabel}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {Badge}
      </motion.div>
    )
  }

  return Badge
}
