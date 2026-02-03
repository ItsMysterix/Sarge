"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { UserProfile } from "./user-profile"
import { ProjectSwitcher } from "@/components/project-switcher"
import { useProject } from "@/lib/project-context"
import { Search, Bell, Plus } from "lucide-react"

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/projects": "Projects",
  "/environments": "Environments",
  "/deployments": "Pipelines",
  "/logs": "Logs",
  "/observability": "Metrics",
  "/metrics": "Metrics",
  "/settings": "Settings",
  "/profile": "Profile",
  "/stacks": "Stacks",
  "/services": "Services",
  "/aws": "AWS",
  "/oneclick": "Deploy",
  "/targets": "Targets",
  "/explain": "Explain",
}

export function Header() {
  const pathname = usePathname()
  const { projects } = useProject()
  
  // Get page title from route
  const getPageTitle = () => {
    if (!pathname) return "Dashboard"
    
    // Check for exact match first
    if (pageTitles[pathname]) return pageTitles[pathname]
    
    // Check for prefix match (e.g. /deployments/123)
    for (const [route, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(route)) return title
    }
    
    // Fallback to capitalizing the first segment
    const segment = pathname.split('/')[1]
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard"
  }
  
  const pageTitle = getPageTitle()
  
  // Hide "New" button on certain pages
  const showNewButton = !pathname?.startsWith('/profile') && !pathname?.startsWith('/settings')

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] bg-black/40 backdrop-blur-md sticky top-0 z-50">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-foreground">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-[10px] bg-white/5 rounded">⌘K</kbd>
        </button>
        
        {/* Notifications */}
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        
        {/* New button */}
        {showNewButton && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        )}
      </div>
    </header>
  )
}
