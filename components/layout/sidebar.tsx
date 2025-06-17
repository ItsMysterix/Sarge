"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Rocket, Activity, FileText, Settings, Menu, X } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Services", href: "/services", icon: Activity },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
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
          {/* Logo */}
          <div className="flex items-center mb-8 pt-8 lg:pt-0">
            <div className="text-2xl font-bold text-accent terminal-text">SARGE</div>
            <div className="ml-2 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          </div>

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
