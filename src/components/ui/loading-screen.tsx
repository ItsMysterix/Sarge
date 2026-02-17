"use client"

import { Brain } from "lucide-react"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
}

// Shared full-screen loading used across pages to keep visuals consistent
export function LoadingScreen({ title = "Initializing", subtitle = "Please wait…" }: LoadingScreenProps) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="text-4xl font-bold text-accent terminal-text">SARGE</div>
          <div className="ml-3 w-3 h-3 bg-accent rounded-full animate-pulse" />
        </div>

        <div className="glass-card p-8 rounded-lg border border-white/10">
          <Brain className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-gray-400 mb-4">{subtitle}</p>

          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
