"use client"

import React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { usePathname } from "next/navigation"
import { useProject } from "@/lib/project-context"

interface AppShellProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function AppShell({ children, showSidebar }: AppShellProps) {
  const pathname = usePathname()
  const { currentProject } = useProject()

  // Auto-hide sidebar on routes that are not project-scoped or when no project is selected
  const routeHidesSidebar = pathname?.startsWith('/projects')
  const autoShow = !!currentProject && !routeHidesSidebar
  const shouldShowSidebar = typeof showSidebar === 'boolean' ? showSidebar : autoShow

  return (
    <div className="h-screen bg-[#0f0f0f] overflow-hidden flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {shouldShowSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
