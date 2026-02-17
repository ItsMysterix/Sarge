"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface TimelineItemProps {
  title: string
  description: string
  timestamp: string
  icon: LucideIcon
  status?: "success" | "error" | "warning" | "pending" | "running"
  metadata?: Array<{ label: string; value: string }>
  actions?: Array<{ label: string; onClick: () => void; variant?: "default" | "danger" }>
  isLast?: boolean
  delay?: number
}

export function TimelineItem({
  title,
  description,
  timestamp,
  icon: Icon,
  status,
  metadata,
  actions,
  isLast = false,
  delay = 0
}: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative pl-8 pb-6"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gradient-to-b from-accent/50 to-transparent" />
      )}

      {/* Icon Circle */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
        <Icon className="w-4 h-4 text-accent" />
      </div>

      {/* Content Card */}
      <div className="glass-card p-4 border border-white/10 hover:border-accent/30 transition-all duration-300">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          {status && (
            <StatusBadge status={status} size="sm" />
          )}
        </div>

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
            {metadata.map((item, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{item.label}:</span>{" "}
                <span className="text-gray-300 terminal-text font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 terminal-text mt-2">
          {timestamp}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${action.variant === "danger"
                    ? "bg-error/10 text-error hover:bg-error/20 border border-error/30"
                    : "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30"
                  }
                `}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
