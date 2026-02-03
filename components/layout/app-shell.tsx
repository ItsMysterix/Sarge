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
          <header className="h-14 px-6 flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-sm shrink-0">
            {/* Breadcrumb / Page Title - will be set by pages */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/10 transition-all">
                <Search className="w-4 h-4" />
                <span className="text-xs">Search</span>
                <div className="flex gap-0.5 ml-2">
                  <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">⌘</kbd>
                  <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">K</kbd>
                </div>
              </button>
              
              {/* Notifications */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              
              {/* New Action */}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                New
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
