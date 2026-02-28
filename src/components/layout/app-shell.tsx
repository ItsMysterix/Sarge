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

  const hideSidebar = pathname === "/landing" || 
                      pathname?.startsWith('/sign-in') || 
                      pathname?.startsWith('/sign-up')

  return (
    <div className="h-screen bg-[#050505] overflow-hidden flex font-sans selection:bg-indigo-500/30">
      {!hideSidebar && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!hideSidebar && (
          <header className="h-20 px-8 flex items-center justify-between shrink-0 z-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
            {/* Left Section: Breadcrumb & Switcher */}
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-4">
                  {title && (
                    <>
                      <div className="text-sm font-semibold text-white/50">{title}</div>
                      <div className="h-4 w-px bg-white/10" />
                    </>
                  )}
                  
                  <DropdownMenu>
                     <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors outline-none">
                        <span>{isProjectLoading ? "Loading..." : (currentProject?.name || "Select Project")}</span>
                        <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-64 bg-[#0a0a0a] border-white/5 p-2 rounded-xl shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-3 py-2">Projects</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <div className="max-h-64 overflow-y-auto custom-scrollbar my-1">
                          {projects.map((p) => (
                             <DropdownMenuItem 
                               key={p.id} 
                               onClick={() => setCurrentProject(p)}
                               className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 focus:bg-white/5 transition-colors cursor-pointer group"
                             >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-sm font-medium text-white/80">{p.name}</span>
                                  <span className="text-[10px] text-white/20 uppercase tracking-widest">{p.slug || p.id.slice(0,8)}</span>
                                </div>
                                {currentProject?.id === p.id && <Check className="w-4 h-4 text-indigo-500" />}
                             </DropdownMenuItem>
                          ))}
                        </div>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        <DropdownMenuItem 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 focus:bg-white/5 text-indigo-400 text-sm font-medium cursor-pointer"
                          onClick={() => router.push('/projects')}
                        >
                           <Plus className="w-4 h-4" />
                           Create New Project
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
            
            {/* Center/Right Section */}
            <div className="flex items-center gap-6">
              {/* Search */}
              <button 
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}
                className="flex items-center justify-between w-64 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/20 hover:border-white/10 hover:bg-white/[0.05] transition-all outline-none"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4" />
                  <span>Search...</span>
                </div>
                <div className="flex gap-1.5 opacity-40">
                  <kbd className="text-[10px] bg-black px-1.5 py-0.5 rounded border border-white/10 font-sans">⌘</kbd>
                  <kbd className="text-[10px] bg-black px-1.5 py-0.5 rounded border border-white/10 font-sans">K</kbd>
                </div>
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-sm font-medium text-white/30 mr-2">
                  <ModeToggle />
                  <a href="mailto:support@sarge.dev" className="hover:text-white transition-colors">Feedback</a>
                  <a href="/docs" className="hover:text-white transition-colors">Docs</a>
                </div>
                <NotificationPopover />
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-0 custom-scrollbar">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
