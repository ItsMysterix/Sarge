"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { usePathname, useRouter } from "next/navigation"
import { Search, ChevronsUpDown, Check, Plus } from "lucide-react"
import { NotificationPopover } from "../ui/notification-popover"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useProject } from "@/lib/project-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { CommandPalette } from "./command-palette"

interface AppShellProps {
  children: React.ReactNode
  title?: React.ReactNode
  actions?: React.ReactNode
}

export function AppShell({ children, title, actions }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { currentProject, projects, setCurrentProject, isLoading: isProjectLoading } = useProject()

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
          <header className="h-16 px-6 flex items-center justify-between glass-header shrink-0 z-10 border-b border-border">
            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-4">
               {/* Page Title */}
               <span className="text-sm font-medium text-foreground">{title}</span>

               {/* Separator */}
               {title && <div className="h-4 w-px bg-border hidden sm:block" />}

               {/* Project Switcher */}
               <div className="flex items-center gap-2 text-sm">
                  <DropdownMenu>
                     <DropdownMenuTrigger className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors outline-none group">
                        <span className="truncate max-w-[150px]">
                          {isProjectLoading ? "Loading..." : (currentProject?.name || "Select Project")}
                        </span>
                        <ChevronsUpDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-[200px]">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Project</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {projects.map((p) => (
                           <DropdownMenuItem 
                             key={p.id} 
                             onClick={() => setCurrentProject(p)}
                             className="justify-between"
                           >
                              <span className="truncate">{p.name}</span>
                              {currentProject?.id === p.id && <Check className="w-3 h-3" />}
                           </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-muted-foreground cursor-pointer"
                          onClick={() => router.push('/projects')}
                        >
                           <Plus className="w-3 h-3 mr-2" />
                           Create Project
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Custom Page Actions */}
              {actions && (
                <>
                  {actions}
                  <div className="w-px h-4 bg-border mx-1" />
                </>
              )}

              {/* Search Trigger */}
              <button 
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}
                className="relative group cursor-pointer flex items-center justify-between w-48 focus-within:w-64 transition-[width] h-9 px-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:border-border/80 outline-none"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Search...</span>
                </div>
                <div className="flex gap-1 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                  <kbd className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-border font-mono font-medium">⌘</kbd>
                  <kbd className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-border font-mono font-medium">K</kbd>
                </div>
              </button>

              <div className="w-px h-4 bg-border mx-1" />
              
              <ModeToggle />
              
              <div className="w-px h-4 bg-border mx-1" />
              
              <a href="mailto:support@sarge.dev" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Feedback</a>
              <a href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-2">Docs</a>
              
              {/* Notifications */}
              <NotificationPopover />
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
