"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { UserProfile } from "./user-profile"
import { ProjectSwitcher } from "@/components/project-switcher"
import { useProject } from "@/lib/project-context"
import { GitBranch, Plus } from "lucide-react"
import { motion } from "framer-motion"

export function Header() {
  const [time, setTime] = useState("")
  const [showConnectModal, setShowConnectModal] = useState(false)
  const pathname = usePathname()
  const { projects } = useProject()
  
  // Design rule: show brand + switcher on all pages except Profile (brand-only there)
  const isProfilePage = pathname?.startsWith('/profile')
  // Hide switcher on the projects listing page entirely
  const isProjectsListing = pathname === '/projects'
  // Hide switcher when there are no real projects (avoid showing mock placeholder)
  const hasRealProjects = Array.isArray(projects) && projects.some(p => p.slug !== 'my-nextjs-app')

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
  <header className="glass-card border-b border-white/10 px-3 sm:px-4 md:px-6 py-2 sm:py-3 sticky top-0 z-50 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Brand is always visible */}
          <div className="flex items-center flex-shrink-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent terminal-text whitespace-nowrap">SARGE</div>
            <div className="ml-1 sm:ml-2 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-accent rounded-full animate-pulse" aria-label="live-indicator" />
          </div>
          {/* Project switcher: hide on Profile, on Projects listing, or when there are no real projects */}
          {!isProfilePage && !isProjectsListing && hasRealProjects && (
            <div className="hidden sm:block min-w-0">
              <ProjectSwitcher />
            </div>
          )}
          {/* version badge removed per design */}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-6 flex-shrink-0">
          <div className="hidden md:block px-2 sm:px-3 py-1.5 glass-card text-[10px] sm:text-xs terminal-text text-gray-400 border border-white/10">
            AI Co-Pilot
          </div>
          <div className="hidden sm:block terminal-text text-accent text-xs sm:text-sm font-mono opacity-70" aria-label="clock">
            {time}
          </div>
          <UserProfile />
          <div className="hidden sm:block w-2 sm:w-3 h-2 sm:h-3 bg-accent rounded-full animate-pulse-glow" aria-label="system-status" />
        </div>
      </div>
    </header>
  )
}
