"use client"

import { motion } from "framer-motion"
import { Keyboard } from "lucide-react"

export function ShortcutsTab() {
  const shortcuts = [
    { category: "Navigation", items: [
      { keys: ["⌘", "K"], description: "Quick search" },
      { keys: ["⌘", "D"], description: "Go to Dashboard" },
      { keys: ["⌘", "M"], description: "Go to Metrics" },
      { keys: ["⌘", "L"], description: "Go to Logs" },
    ]},
    { category: "Actions", items: [
      { keys: ["⌘", "S"], description: "Save changes" },
      { keys: ["⌘", "R"], description: "Refresh data" },
      { keys: ["⌘", "N"], description: "New deployment" },
      { keys: ["⌘", "⇧", "P"], description: "Command palette" },
    ]},
    { category: "Editing", items: [
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "C"], description: "Copy" },
      { keys: ["⌘", "V"], description: "Paste" },
    ]},
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Keyboard className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        </div>
        
        <div className="space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">{section.category}</h4>
              <div className="space-y-2">
                {section.items.map((shortcut, sidx) => (
                  <div key={sidx} className="flex items-center justify-between p-3 glass-card rounded border border-white/10">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <kbd 
                          key={kidx}
                          className="px-2 py-1 text-xs font-mono glass-card border border-white/20 rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 border border-white/10 opacity-50">
        <h3 className="text-lg font-semibold mb-4">Custom Shortcuts</h3>
        <p className="text-sm text-gray-400 mb-4">
          Create your own keyboard shortcuts for frequently used actions
        </p>
        <button 
          disabled
          className="px-4 py-2 glass-card border border-white/10 rounded text-sm cursor-not-allowed"
        >
          Configure Custom Shortcuts
        </button>
        <div className="text-xs text-gray-500 mt-2">Coming soon</div>
      </div>
    </motion.div>
  )
}
