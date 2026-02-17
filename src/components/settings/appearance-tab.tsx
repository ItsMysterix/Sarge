"use client"

import { motion } from "framer-motion"
import { Moon, Sun, Monitor, Palette, Sparkles } from "lucide-react"

interface AppearanceTabProps {
  themeMode: "dark" | "light" | "system"
  enableAnimations: boolean
  onThemeChange: (theme: "dark" | "light" | "system") => void
  onAnimationsToggle: (enabled: boolean) => void
}

export function AppearanceTab({
  themeMode,
  enableAnimations,
  onThemeChange,
  onAnimationsToggle
}: AppearanceTabProps) {
  const themes = [
    { id: "dark" as const, label: "Dark", icon: Moon, description: "Dark theme for low-light environments" },
    { id: "light" as const, label: "Light", icon: Sun, description: "Light theme for bright environments" },
    { id: "system" as const, label: "System", icon: Monitor, description: "Follow system preferences" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Theme Selection */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-5 h-5 text-accent dark:text-accent-foreground" />
          <h3 className="text-lg font-semibold">Theme</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const Icon = theme.icon
            const isActive = themeMode === theme.id
            
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isActive 
                    ? 'bg-accent/20 border-accent' 
                    : 'glass-card hover:border-accent/40'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-full ${isActive ? 'bg-accent/20' : 'bg-muted'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-accent dark:text-accent-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <div className={`font-medium ${isActive ? 'text-accent' : ''}`}>
                      {theme.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {theme.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Animation Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent dark:text-accent-foreground" />
            <h3 className="text-lg font-semibold">Animations</h3>
          </div>
          <div className="px-2 py-1 rounded text-[10px] bg-accent/10 border border-accent/20 text-accent font-bold uppercase tracking-wider">
            Service Powered
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 glass-card">
            <div>
              <div className="font-medium">Enable Animations</div>
              <div className="text-sm text-muted-foreground">Show smooth transitions and effects</div>
            </div>
            <button
              onClick={() => onAnimationsToggle(!enableAnimations)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${enableAnimations ? 'bg-accent' : 'bg-muted'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${enableAnimations ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          
          <div className="p-4 glass-card opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Reduce Motion</div>
                <div className="text-sm text-muted-foreground">Minimize animations for accessibility</div>
              </div>
              <button
                disabled
                className="relative w-12 h-6 rounded-full bg-muted cursor-not-allowed"
              >
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Coming soon</div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="w-5 h-5 text-accent dark:text-accent-foreground" />
          <h3 className="text-lg font-semibold">Display</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 glass-card opacity-50">
            <div>
              <div className="font-medium">Compact Mode</div>
              <div className="text-sm text-muted-foreground">Reduce spacing for denser layout</div>
            </div>
            <button
              disabled
              className="relative w-12 h-6 rounded-full bg-muted cursor-not-allowed"
            >
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
            </button>
            
          </div>
          <div className="text-xs text-gray-500 px-4">Coming soon</div>
        </div>
      </div>
    </motion.div>
  )
}
