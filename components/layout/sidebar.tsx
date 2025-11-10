"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Rocket, Activity, FileText, Settings, Menu, X, Layers, Cloud, Zap, FolderOpen } from "lucide-react"
import { ProjectSwitcher } from "@/components/project-switcher"

const navigation = [
  { name: "Workspace", href: "/", icon: Home, description: "Overview of your local infrastructure" },
  { name: "One-Click Deploy", href: "/oneclick", icon: Zap, description: "Detect, plan & deploy in 3 steps" },
  { name: "Workspaces", href: "/workspaces", icon: FolderOpen, description: "Manage local dev workspaces" },
  { name: "Stacks", href: "/stacks", icon: Layers, description: "Compose services into applications" },
  { name: "AWS Emulation", href: "/aws", icon: Cloud, description: "S3, DynamoDB, Lambda & more—offline" },
  { name: "Metrics", href: "/metrics", icon: Activity, description: "Real-time performance data" },
  { name: "Logs", href: "/logs", icon: FileText, description: "Structured logs from all services" },
  { name: "Deployments", href: "/deployments", icon: Rocket, description: "Legacy deployment pipeline" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Configure workspace & snapshots" },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-card p-2 hover:bg-white/10 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-card border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Top spacing (brand removed per new global header design) */}
          <div className="mb-4 pt-8 lg:pt-0" />

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          isActive
                            ? "bg-accent/20 text-accent border border-accent/30 glow-accent"
                            : "hover:bg-white/5 hover:text-accent"
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Status indicator */}
          <div className="mt-auto p-4 glass-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">System Status</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-accent">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
