"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Layers,
  GitBranch, 
  Activity, 
  Settings, 
  Menu, 
  X, 
  Box,
  Terminal,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/project-context"
import { useUser, useAuth } from "@/lib/clerk-safe"

// Simplified navigation - Variables now in Settings
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
  const router = useRouter()
  const { currentProject } = useProject()
  const { user } = useUser()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg hover:bg-white/5 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
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
        <div className="h-14 flex items-center justify-center border-b border-white/[0.06]">
          <Link href="/projects" className="group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          </Link>
        </div>

        {/* Project Indicator (if selected) */}
        {currentProject && (
          <Link 
            href="/projects"
            className="mx-2 mt-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
            title={currentProject.name}
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Box className="w-4 h-4 text-indigo-400" />
            </div>
          </Link>
        )}

        {/* Navigation - Centered Vertically */}
        <nav className="flex-1 flex flex-col justify-center py-4 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href))
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
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
                      {item.name}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-white/[0.06] space-y-1">
          {/* User Avatar - Links to Profile */}
          <Link 
            href="/profile"
            className="sidebar-icon group relative"
            title={user?.fullName || "Profile"}
          >
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || "User"} 
                className="w-7 h-7 rounded-full ring-2 ring-white/10"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center ring-2 ring-white/10">
                <span className="text-[10px] font-bold text-white">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
              Profile
            </div>
          </Link>
          
          {/* Logout - Red and Functional */}
          <button 
            onClick={handleSignOut}
            className="sidebar-icon w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 group relative"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
              Sign out
            </div>
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
