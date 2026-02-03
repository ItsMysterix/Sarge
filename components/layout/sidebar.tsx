"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Layers,
  GitBranch, 
  Activity, 
  Settings, 
  Menu, 
  X, 
  Terminal,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Environments", href: "/environments", icon: Layers },
  { name: "Pipelines", href: "/deployments", icon: GitBranch },
  { name: "Logs", href: "/logs", icon: Terminal },
  { name: "Metrics", href: "/observability", icon: Activity },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-16 flex flex-col",
          "bg-zinc-950 border-r border-zinc-800",
          "transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-zinc-800">
          <Link href="/projects">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="flex-1 flex flex-col justify-center py-4">
          <ul className="space-y-2 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href))
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "bg-white/10 text-white" 
                        : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                    )}
                    title={item.name}
                  >
                    <item.icon className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none shadow-xl z-50">
                      {item.name}
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-6 -ml-2 bg-violet-500 rounded-r" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-zinc-800 space-y-2">
          {/* User Avatar */}
          <Link 
            href="/profile"
            className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all mx-auto"
            title="Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">U</span>
            </div>
          </Link>
          
          {/* Logout */}
          <button 
            className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all mx-auto"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/60" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
