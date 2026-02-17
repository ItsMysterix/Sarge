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
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    borderColor: "border-foreground/20",
    label: "Success"
  },
  error: {
    icon: XCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/20",
    label: "Error"
  },
  failed: {
    icon: XCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/20",
    label: "Failed"
  },
  warning: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/20",
    label: "Warning"
  },
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted-foreground/20",
    label: "Pending"
  },
  running: {
    icon: Loader2,
    color: "text-foreground",
    bgColor: "bg-foreground/5",
    borderColor: "border-foreground/20",
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
