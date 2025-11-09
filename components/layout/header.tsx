"use client"

import { useEffect, useState } from "react"
import { UserProfile } from "./user-profile"
import { ProjectSwitcher } from "@/components/project-switcher"

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
        <div className="flex items-center gap-4">
          {/* Project Switcher in header */}
          <ProjectSwitcher />
        </div>

        <div className="flex items-center space-x-6">
          {/* AI Co-Pilot badge moved to right side */}
          <div className="px-3 py-1.5 glass-card text-xs terminal-text text-gray-400 border border-white/10">
            AI Co-Pilot
          </div>
          <UserProfile />
          <div className="terminal-text text-accent text-lg font-mono">{time}</div>
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow"></div>
        </div>
      </div>
    </header>
  )
}
