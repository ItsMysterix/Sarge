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
  LogOut,
  FolderKanban,
  Shield,
  Coins,
  GitCompare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/project-context"
import { useUser, useAuth } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"

// Navigation items (only shown when project exists)
const projectNavigation = [
  { name: "Orchestration", href: "/orchestration", icon: Layers },
  { name: "Governance", href: "/governance", icon: Shield },
  { name: "Observability", href: "/observability", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { currentProject } = useProject()
  const { user } = useUser()
  const { signOut } = useAuth()
  
  // Check if any projects exist
  const projectsQuery = trpc.project.list.useQuery()
  const projects = projectsQuery.data?.projects || []
  const hasProjects = projects.length > 0

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg hover:bg-white/5 transition-colors"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="main-sidebar"
      >
        {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
      </button>

      {/* Sidebar */}
      <div
        id="main-sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-16 flex flex-col",
          "glass-panel border-r",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border relative">
          <Link href="/projects" className="group relative">
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 flex items-center justify-center shadow-lg group-hover:border-violet-500/50 transition-all duration-300 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white group-hover:text-violet-400 transition-colors">
                 <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </Link>
        </div>

        {/* Navigation - Centered Vertically */}
        <nav className="flex-1 flex flex-col justify-center py-4 px-2" aria-label="Primary">
          <ul className="space-y-1" role="list">
            {/* Projects - Always visible */}
            <li>
              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "sidebar-icon group relative transition-all duration-200",
                  pathname === "/projects" 
                    ? "sidebar-icon-active" 
                    : "sidebar-icon"
                )}
                title="Projects"
                aria-label="Projects"
                aria-current={pathname === '/projects' ? 'page' : undefined}
              >
                <FolderKanban className="w-5 h-5" aria-hidden="true" />
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl" aria-hidden="true">
                  Projects
                </div>
              </Link>
            </li>
            
            {/* Project-specific nav - Only visible when projects exist */}
            {hasProjects && (
              <>
                {/* Separator */}
                <li className="py-2">
                  <div className="w-8 mx-auto border-t border-white/[0.06]" />
                </li>
                
                {projectNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/" && pathname?.startsWith(item.href))
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "sidebar-icon group relative transition-all duration-200",
                          isActive 
                            ? "sidebar-icon-active" 
                            : "sidebar-icon"
                        )}
                        title={item.name}
                        aria-label={item.name}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl" aria-hidden="true">
                          {item.name}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </>
            )}
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
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
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
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
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
