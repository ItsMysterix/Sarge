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
    <div className="h-screen bg-[#050505] overflow-hidden flex font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.03),transparent_50%)] pointer-events-none" />
        
        {/* Global Header */}
        {!hideSidebar && (
          <header className="h-20 px-8 flex items-center justify-between shrink-0 z-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-8">
               {/* Page Title */}
               <div className="transition-all duration-700">
                  {title}
               </div>

               {/* Separator - Industrial weighting */}
               {title && <div className="h-6 w-px bg-white/5 hidden sm:block shadow-[0_0_10px_rgba(255,255,255,0.05)]" />}

               {/* Project Switcher */}
               <div className="flex items-center gap-2">
                  <DropdownMenu>
                     <DropdownMenuTrigger className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.05] hover:border-white/10 transition-all outline-none group">
                        <span className="truncate max-w-[180px]">
                          {isProjectLoading ? "Loading..." : (currentProject?.name || "Select Project")}
                        </span>
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground/20 group-hover:text-foreground transition-colors" />
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-[280px] bg-[#0a0a0a] border-white/5 p-2 rounded-2xl shadow-3xl text-foreground">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 px-4 py-3">Global_Manifest_Index</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar my-2 pr-1">
                          {projects.map((p) => (
                             <DropdownMenuItem 
                               key={p.id} 
                               onClick={() => setCurrentProject(p)}
                               className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.03] focus:bg-white/[0.03] transition-all cursor-pointer group"
                             >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[11px] font-black uppercase tracking-widest truncate">{p.name}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors uppercase tracking-widest leading-none">ID: {p.slug || p.id.slice(0,8)}</span>
                                </div>
                                {currentProject?.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                             </DropdownMenuItem>
                          ))}
                        </div>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <DropdownMenuItem 
                          className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/[0.03] focus:bg-white/[0.03] text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer"
                          onClick={() => router.push('/projects')}
                        >
                           <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                             <Plus className="w-3.5 h-3.5" />
                           </div>
                           Manifest_New_Project
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-6">
              {/* Custom Page Actions */}
              {actions && (
                <div className="flex items-center gap-4 border-r border-white/5 pr-6 h-10">
                  {actions}
                </div>
              )}

              {/* Console Trigger */}
              <button 
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}
                className="relative group cursor-pointer flex items-center justify-between w-64 focus-within:w-80 transition-all duration-700 h-11 px-5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 hover:border-white/20 hover:bg-white/[0.05] outline-none"
              >
                <div className="flex items-center gap-4">
                  <Search className="w-4 h-4 text-muted-foreground/20 group-hover:text-indigo-500/40 transition-colors" />
                  <span className="group-hover:text-muted-foreground/40 transition-colors">Commander_Index...</span>
                </div>
                <div className="flex gap-2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                  <kbd className="text-[9px] bg-[#050505] px-2 py-1 rounded-lg border border-white/5 font-mono font-black text-indigo-400/40 shadow-inner">⌘</kbd>
                  <kbd className="text-[9px] bg-[#050505] px-2 py-1 rounded-lg border border-white/5 font-mono font-black text-indigo-400/40 shadow-inner">K</kbd>
                </div>
              </button>

              <div className="flex items-center gap-6">
                <div className="flex items-center border-x border-white/5 px-6 h-10 gap-6">
                  <a href="/docs" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 hover:text-foreground transition-all">Protocol_Docs</a>
                  <a href="mailto:support@sarge.dev" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 hover:text-foreground transition-all">Support_Uplink</a>
                </div>
                
                <div className="flex items-center gap-4">
                  <ModeToggle />
                  <NotificationPopover />
                </div>
              </div>
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 custom-scrollbar">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
