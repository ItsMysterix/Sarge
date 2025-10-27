"use client"

import { motion } from "framer-motion"
import { Play, RotateCcw, Terminal, Activity, AlertCircle } from "lucide-react"
import { useState } from "react"
import { UserRole } from "@/hooks/useUserRole"

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  variant?: "default" | "danger" | "warning"
  requiresRole?: UserRole[]
}

interface Props {
  userRole: UserRole
  onDeploy?: () => void
  onRollback?: () => void
  onViewLogs?: () => void
  onRefresh?: () => void
}

export function QuickActionsPanel({ userRole, onDeploy, onRollback, onViewLogs, onRefresh }: Props) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const actions: QuickAction[] = [
    {
      id: "deploy",
      label: "Quick Deploy",
      icon: <Play className="w-4 h-4" />,
      action: onDeploy || (() => {}),
      variant: "default",
      requiresRole: ["developer", "manager"],
    },
    {
      id: "rollback",
      label: "Rollback",
      icon: <RotateCcw className="w-4 h-4" />,
      action: onRollback || (() => {}),
      variant: "danger",
      requiresRole: ["developer"],
    },
    {
      id: "logs",
      label: "View Logs",
      icon: <Terminal className="w-4 h-4" />,
      action: onViewLogs || (() => {}),
      variant: "default",
    },
    {
      id: "refresh",
      label: "Refresh",
      icon: <Activity className="w-4 h-4" />,
      action: onRefresh || (() => {}),
      variant: "default",
    },
  ]

  const visibleActions = actions.filter(
    (action) => !action.requiresRole || action.requiresRole.includes(userRole)
  )

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case "danger":
        return "bg-error/10 border-error/30 text-error hover:bg-error/20 hover:border-error/50"
      case "warning":
        return "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20 hover:border-warning/50"
      default:
        return "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/50"
    }
  }

  if (visibleActions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border border-white/10 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
        </div>
        <div className="text-xs text-gray-500 terminal-text">
          {userRole === "developer" ? "🔧 Developer" : userRole === "manager" ? "👔 Manager" : "👁️ Viewer"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleActions.map((action, i) => (
          <motion.button
            key={action.id}
            onClick={action.action}
            onHoverStart={() => setHoveredAction(action.id)}
            onHoverEnd={() => setHoveredAction(null)}
            className={`px-4 py-3 rounded-lg border transition-all text-sm font-medium flex items-center justify-center gap-2 ${getVariantClasses(
              action.variant
            )}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={hoveredAction === action.id ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              {action.icon}
            </motion.div>
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {userRole === "viewer" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 mt-3 text-center"
        >
          Limited actions available in viewer mode. Contact admin for elevated access.
        </motion.p>
      )}
    </motion.div>
  )
}
