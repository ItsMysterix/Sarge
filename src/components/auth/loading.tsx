"use client"

import { Brain } from "lucide-react"

export function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="text-4xl font-bold text-accent terminal-text">SARGE</div>
          <div className="ml-3 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
        </div>

        <div className="glass-card p-8 rounded-lg border border-white/10">
          <Brain className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">Initializing Command Center</h2>
          <p className="text-gray-400 mb-4">Authenticating secure access...</p>

          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        <div className="text-xs text-gray-500 terminal-text mt-6">Secure authentication in progress...</div>
      </div>
    </div>
  )
}
