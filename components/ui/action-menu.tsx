"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MoreVertical, LucideIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface MenuAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: "default" | "danger" | "warning"
  disabled?: boolean
}

interface ActionMenuProps {
  actions: MenuAction[]
  align?: "left" | "right"
}

const variantStyles = {
  default: "hover:bg-accent/10 hover:text-accent",
  danger: "hover:bg-error/10 hover:text-error",
  warning: "hover:bg-warning/10 hover:text-warning"
}

export function ActionMenu({ actions, align = "right" }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      >
        <MoreVertical className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute top-full mt-2 w-48 glass-card border border-white/10 rounded-lg
              shadow-xl z-50 py-1
              ${align === "right" ? "right-0" : "left-0"}
            `}
          >
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!action.disabled) {
                      action.onClick()
                      setIsOpen(false)
                    }
                  }}
                  disabled={action.disabled}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center gap-3
                    transition-colors
                    ${action.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : variantStyles[action.variant || "default"]
                    }
                  `}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{action.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
