"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { UserProfile } from "./user-profile"
import { ProjectSwitcher } from "@/components/project-switcher"

export function Header() {
  const [time, setTime] = useState("")
  const pathname = usePathname()
  
  // Don't show project switcher on projects page (they select from grid)
  const isProjectsPage = pathname === '/projects'

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
    <header className="glass-card border-b border-white/10 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sarge logo/text */}
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Sarge
          </div>
          
          {/* Project Switcher (hidden on projects page) */}
          {!isProjectsPage && (
            <>
              <div className="w-px h-6 bg-white/10" />
              <ProjectSwitcher />
            </>
          )}
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
