"use client"

import { useEffect, useState } from "react"

export function Header() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="glass-card border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-accent terminal-text">SARGE</h1>
          <div className="ml-3 px-2 py-1 glass-card text-xs terminal-text text-gray-400">AI Co-Pilot</div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-300">
            Welcome, <span className="text-accent">Alex Chen</span>
          </div>
          <div className="terminal-text text-accent text-lg font-mono">{time}</div>
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow"></div>
        </div>
      </div>
    </header>
  )
}
