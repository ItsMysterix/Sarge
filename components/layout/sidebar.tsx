"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Rocket, 
  Activity, 
  Settings, 
  Menu, 
  X, 
  FolderKanban,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

// Simplified navigation - 5 core items
const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Observability", href: "/observability", icon: Activity },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg hover:bg-white/5 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Icon only */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-16 flex flex-col",
          "bg-black/60 backdrop-blur-xl border-r border-white/[0.06]",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "sidebar-icon group relative",
                      isActive && "sidebar-icon-active"
                    )}
                    title={item.name}
                  >
                    <item.icon className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 px-2 py-1 bg-card border border-border rounded-md text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                      {item.name}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom section - User & Logout */}
        <div className="p-2 border-t border-white/[0.06] space-y-2">
          {/* User Avatar */}
          <div className="sidebar-icon">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">U</span>
            </div>
          </div>
          
          {/* Logout */}
          <button 
            className="sidebar-icon w-full"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
