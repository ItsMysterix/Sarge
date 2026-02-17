"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { usePathname, useRouter } from "next/navigation"
import { Search, Plus, Bell } from "lucide-react"
import { NotificationPopover } from "../ui/notification-popover"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/projects?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Hide sidebar only on landing and auth pages
  const hideSidebar = pathname === "/landing" || 
                      pathname?.startsWith('/sign-in') || 
                      pathname?.startsWith('/sign-up')

  return (
    <div className="h-screen bg-background overflow-hidden flex font-sans">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        {!hideSidebar && (
          <header className="h-16 px-6 flex items-center justify-between border-b border-white/[0.06] bg-black/40 backdrop-blur-xl shrink-0 z-10">
            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground/60">Dashboard</span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-muted-foreground focus:text-foreground focus:border-white/10 focus:bg-white/[0.05] transition-all outline-none placeholder:text-muted-foreground/50"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                    <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono text-muted-foreground">↵</kbd>
                  </div>
                </div>
              </form>

              <div className="w-px h-4 bg-white/[0.06] mx-1" />
              
              <a href="mailto:support@sarge.dev" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Feedback</a>
              <a href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-2">Docs</a>
              
              {/* Notifications */}
              <NotificationPopover />
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
