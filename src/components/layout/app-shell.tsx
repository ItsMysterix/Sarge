"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { NotificationPopover } from "../ui/notification-popover"
import { ModeToggle } from "@/components/ui/mode-toggle"

interface AppShellProps {
  children: React.ReactNode
  title?: React.ReactNode
  actions?: React.ReactNode
}

export function AppShell({ children, title, actions }: AppShellProps) {
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
          <header className="h-16 px-6 flex items-center justify-between glass-header shrink-0 z-10">
            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground/90">{title || "Dashboard"}</span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Custom Page Actions */}
              {actions && (
                <>
                  {actions}
                  <div className="w-px h-4 bg-white/[0.06] mx-1" />
                </>
              )}

              {/* Search */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 h-9 pl-9 pr-3 rounded-lg bg-accent/20 border border-border text-xs text-muted-foreground focus:text-foreground focus:border-accent focus:bg-accent/30 transition-all outline-none placeholder:text-muted-foreground/50 transition-all duration-300"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                    <kbd className="text-[10px] bg-accent/20 px-1.5 py-0.5 rounded border border-border font-mono text-muted-foreground font-semibold">↵</kbd>
                  </div>
                </div>
              </form>

              <div className="w-px h-4 bg-white/[0.06] mx-1" />
              
              <ModeToggle />
              
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
