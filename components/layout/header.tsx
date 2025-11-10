"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { UserProfile } from "./user-profile"
import { ProjectSwitcher } from "@/components/project-switcher"

export function Header() {
  const [time, setTime] = useState("")
  const pathname = usePathname()
  
  // Design rule: show brand + switcher on all pages except Profile (brand-only there)
  const isProfilePage = pathname?.startsWith('/profile')

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
    <header className="glass-card border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Brand is always visible */}
          <div className="flex items-center">
            <div className="text-xl sm:text-2xl font-bold text-accent terminal-text whitespace-nowrap">SARGE</div>
            <div className="ml-2 w-2 h-2 bg-accent rounded-full animate-pulse" aria-label="live-indicator" />
          </div>
          {/* Project switcher on all pages except Profile */}
          {!isProfilePage && (
            <ProjectSwitcher />
          )}
          {/* version badge removed per design */}
        </div>
        <div className="flex items-center space-x-3 sm:space-x-6">
          <div className="px-2 sm:px-3 py-1.5 glass-card text-[10px] sm:text-xs terminal-text text-gray-400 border border-white/10">
            AI Co-Pilot
          </div>
          <div className="hidden sm:block terminal-text text-accent text-xs font-mono opacity-70" aria-label="clock">
            {time}
          </div>
          <UserProfile />
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow" aria-label="system-status" />
        </div>
      </div>
    </header>
  )
}
