"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Command, Keyboard } from "lucide-react"

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifiers?: readonly string[]
}

interface Props {
  shortcuts: KeyboardShortcut[]
}

export function KeyboardShortcuts({ shortcuts }: Props) {
  const [showHelper, setShowHelper] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show keyboard helper with ?
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowHelper((prev) => !prev)
        return
      }

      // Execute shortcuts
      shortcuts.forEach((shortcut) => {
        const modifiersMatch = shortcut.modifiers?.every((mod) => {
          if (mod === "meta") return e.metaKey || e.ctrlKey
          if (mod === "shift") return e.shiftKey
          if (mod === "alt") return e.altKey
          return false
        }) ?? true

        if (modifiersMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          e.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])

  return (
    <>
      {/* Keyboard hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <motion.button
          onClick={() => setShowHelper(!showHelper)}
          className="glass-card px-3 py-2 text-xs text-gray-400 hover:text-accent border border-white/10 hover:border-accent/30 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Keyboard className="w-4 h-4 inline mr-2" />
          Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-accent">?</kbd> for shortcuts
        </motion.button>
      </motion.div>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showHelper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowHelper(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full border border-accent/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <Command className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-bold">Keyboard Shortcuts</h3>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 glass-card rounded-lg hover:bg-white/5"
                  >
                    <span className="text-sm text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.modifiers?.map((mod, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-xs bg-white/10 rounded border border-white/20 text-accent font-mono"
                        >
                          {mod === "meta" ? "⌘" : mod}
                        </kbd>
                      ))}
                      <kbd className="px-2 py-1 text-xs bg-white/10 rounded border border-white/20 text-accent font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Press <kbd className="px-1 bg-white/10 rounded">ESC</kbd> or click outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
