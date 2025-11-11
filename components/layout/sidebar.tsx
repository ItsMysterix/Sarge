"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Rocket, Activity, FileText, Settings, Menu, X, Layers, Cloud, Zap, FolderOpen, Pin, PinOff } from "lucide-react"
import { useProject } from "@/lib/project-context"
import { useSidebarStore } from "@/lib/sidebar-store"
import { useAppStore } from "@/lib/store"

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
  const { currentProject } = useProject()
  const projectId = currentProject?.id ?? null
  const { getStateFor, toggleCollapsed, togglePinnedRoute, hydrate } = useSidebarStore()
  const state = getStateFor(projectId)
  const systemStatus = useAppStore((state) => state.getSystemStatus())

  useEffect(() => {
    hydrate(projectId)
  }, [projectId, hydrate])

  const pinnedSet = useMemo(() => new Set(state.pinnedRoutes), [state.pinnedRoutes])

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'ONLINE', textColor: 'text-green-500' },
    error: { color: 'bg-red-500', label: 'ERROR', textColor: 'text-red-500' },
    stale: { color: 'bg-white', label: 'STALE', textColor: 'text-white' }
  }

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
        fixed inset-y-0 left-0 z-40 ${state.collapsed ? 'w-16' : 'w-64'} glass-card border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Top spacing (brand removed per new global header design) */}
          <div className="mb-4 pt-8 lg:pt-0 flex items-center justify-between">
            <button
              onClick={() => toggleCollapsed(projectId)}
              className="glass-card border border-white/10 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              title={state.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {state.collapsed ? '>>' : '<<'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const isPinned = pinnedSet.has(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group flex items-center ${state.collapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-all duration-200
                        ${
                          isActive
                            ? "bg-accent/20 text-accent border border-accent/30 glow-accent"
                            : "hover:bg-white/5 hover:text-accent"
                        }
                      `}
                      title={state.collapsed ? item.name : undefined}
                    >
                      <item.icon className={`w-5 h-5 ${state.collapsed ? '' : 'mr-3'}`} />
                      {!state.collapsed && (
                        <span className="font-medium flex-1">{item.name}</span>
                      )}
                      {!state.collapsed && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePinnedRoute(projectId, item.href) }}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={isPinned ? 'Unpin' : 'Pin'}
                        >
                          {isPinned ? <PinOff className="w-4 h-4 text-accent" /> : <Pin className="w-4 h-4 text-gray-400 hover:text-white" />}
                        </button>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Pinned section */}
          {!state.collapsed && state.pinnedRoutes.length > 0 && (
            <div className="mt-4">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pinned</div>
              <ul className="space-y-2 mt-1">
                {state.pinnedRoutes.map((href) => {
                  const item = navigation.find(n => n.href === href)
                  if (!item) return null
                  const isActive = pathname === item.href
                  return (
                    <li key={`pin-${href}`}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center px-4 py-2 rounded-lg transition-all duration-200 border
                          ${isActive ? 'bg-accent/10 border-accent/30 text-accent' : 'border-white/10 hover:bg-white/5'}
                        `}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Status indicator */}
          <div className={`mt-auto p-4 glass-card ${state.collapsed ? 'px-2' : ''}`}>
            {state.collapsed ? (
              <div className="flex justify-center" title={`System Status: ${statusConfig[systemStatus].label}`}>
                <div className={`w-3 h-3 ${statusConfig[systemStatus].color} rounded-full ${systemStatus === 'online' ? 'animate-pulse' : ''}`}></div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">System Status</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 ${statusConfig[systemStatus].color} rounded-full ${systemStatus === 'online' ? 'animate-pulse' : ''} mr-2`}></div>
                  <span className={`text-sm ${statusConfig[systemStatus].textColor}`}>{statusConfig[systemStatus].label}</span>
                </div>
              </div>
            )}
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
