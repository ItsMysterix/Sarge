"use client"

import React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface AppShellProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function AppShell({ children, showSidebar = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] overflow-hidden flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        {showSidebar && <Sidebar />}
        <div className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
