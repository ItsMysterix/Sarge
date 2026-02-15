"use client"

import React from "react"
import { Sidebar } from "./sidebar"
import { usePathname } from "next/navigation"
import { Search, Plus, Bell } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

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
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/10 hover:bg-white/[0.05] transition-all w-64">
                  <Search className="w-3.5 h-3.5" />
                  <span className="text-xs">Search...</span>
                  <div className="flex gap-0.5 ml-auto">
                    <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">⌘K</kbd>
                  </div>
                </button>
              </div>

              <div className="w-px h-4 bg-white/[0.06] mx-1" />
              
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Feedback</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-2">Docs</a>
              
              {/* Notifications */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-black" />
              </button>
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
