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
  GitCompare,
  Layout
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/project-context"
import { useUser, useAuth } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"

// Navigation items (only shown when project exists)
const projectNavigation = [
  { name: "Orchestration", href: "/orchestration", icon: Layers },
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
        className="lg:hidden fixed top-6 left-6 z-50 w-12 h-12 flex items-center justify-center bg-[#0a0a0a] border border-white/5 rounded-2xl hover:bg-white/5 transition-all shadow-2xl ring-1 ring-inset ring-white/[0.01]"
        aria-label={isOpen ? 'Close navigation matrix' : 'Open navigation matrix'}
      >
        {isOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-muted-foreground/40" />}
      </button>

      {/* Sidebar */}
      <div
        id="main-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-20 flex flex-col pt-4 items-center gap-8",
          "bg-[#0a0a0a] border-r border-white/5 shadow-2xl ring-1 ring-inset ring-white/[0.01]",
          "transform transition-all duration-700 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none" />

        {/* Logo - Tactical Shield */}
        <div className="flex flex-col items-center justify-center relative z-10">
          <Link href="/projects" className="group relative">
            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
            <div className="w-12 h-12 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center shadow-3xl group-hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden group-hover:scale-105 active:scale-95 ring-1 ring-inset ring-white/[0.01]">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000" />
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/40 group-hover:text-indigo-400 transition-all duration-700">
                 <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                 <path d="M12 9V15M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
            {/* Pulsing indicator - Core Hub State */}
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500/40 border-2 border-[#0a0a0a] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          </Link>
        </div>

        {/* Navigation - Centered High-Density */}
        <nav className="flex-1 flex flex-col py-4 px-2 w-full relative z-10" aria-label="Tactical_Pathways">
          <ul className="space-y-4 flex flex-col items-center w-full" role="list">
            {/* Registry Node Entry */}
            <li className="w-full px-2">
              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "relative flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-700 group ring-1 ring-inset",
                  pathname === "/projects" 
                    ? "bg-white/[0.03] text-foreground border-white/10 ring-white/[0.01] shadow-2xl" 
                    : "text-muted-foreground/20 hover:text-muted-foreground/40 hover:bg-white/[0.01] border-transparent ring-transparent"
                )}
                aria-current={pathname === '/projects' ? 'page' : undefined}
              >
                <FolderKanban className={cn("w-6 h-6 transition-all duration-700", pathname === "/projects" ? "scale-110" : "group-hover:scale-105")} />
                {/* Active Underline */}
                {pathname === "/projects" && (
                   <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                )}
                {/* Tooltip - Industrial Deck */}
                <div className="absolute left-full ml-6 px-5 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 pointer-events-none shadow-3xl z-50 transform translate-x-[-10px] group-hover:translate-x-0 ring-1 ring-inset ring-white/[0.01]">
                  Registry_Matrix
                </div>
              </Link>
            </li>
            
            {/* Protocol-specific nav */}
            {hasProjects && pathname !== '/projects' && (
              <>
                <li className="py-2 w-full px-4">
                  <div className="w-full border-t border-white/5 shadow-inner" />
                </li>
                
                {/* Dashboard Node */}
                <li key="dashboard" className="w-full px-2">
                  <Link
                    href={currentProject?.slug ? `/projects/${currentProject.slug}` : "/projects"}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "relative flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-700 group ring-1 ring-inset",
                      currentProject?.slug && pathname === `/projects/${currentProject.slug}`
                        ? "bg-white/[0.03] text-foreground border-white/10 ring-white/[0.01] shadow-2xl" 
                        : "text-muted-foreground/20 hover:text-muted-foreground/40 hover:bg-white/[0.01] border-transparent ring-transparent"
                    )}
                  >
                    <Layout className={cn("w-6 h-6 transition-all duration-700", (currentProject?.slug && pathname === `/projects/${currentProject.slug}`) ? "scale-110" : "group-hover:scale-105")} />
                    {(currentProject?.slug && pathname === `/projects/${currentProject.slug}`) && (
                       <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                    <div className="absolute left-full ml-6 px-5 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 pointer-events-none shadow-3xl z-50 transform translate-x-[-10px] group-hover:translate-x-0 ring-1 ring-inset ring-white/[0.01]">
                      Node_Command_Deck
                    </div>
                  </Link>
                </li>

                {projectNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/" && pathname?.startsWith(item.href))
                  return (
                    <li key={item.name} className="w-full px-2">
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "relative flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-700 group ring-1 ring-inset",
                          isActive 
                            ? "bg-white/[0.03] text-foreground border-white/10 ring-white/[0.01] shadow-2xl" 
                            : "text-muted-foreground/20 hover:text-muted-foreground/40 hover:bg-white/[0.01] border-transparent ring-transparent"
                        )}
                      >
                        <item.icon className={cn("w-6 h-6 transition-all duration-700", isActive ? "scale-110" : "group-hover:scale-105")} />
                        {isActive && (
                           <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        )}
                        <div className="absolute left-full ml-6 px-5 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 pointer-events-none shadow-3xl z-50 transform translate-x-[-10px] group-hover:translate-x-0 ring-1 ring-inset ring-white/[0.01]">
                          {item.name.toUpperCase()}_MATRIX
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </>
            )}
          </ul>
        </nav>

        {/* Tactical Base Section */}
        <div className="mt-auto p-4 w-full flex flex-col items-center gap-4 border-t border-white/5 relative z-10 bg-[#0a0a0a]">
          <Link 
            href="/profile"
            className="group relative flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-700 hover:bg-white/[0.02]"
          >
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || "Protocol_Access_Admin"} 
                className="w-10 h-10 rounded-xl ring-2 ring-white/5 group-hover:ring-indigo-500/40 transition-all duration-700 grayscale hover:grayscale-0 shadow-2xl"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center ring-2 ring-white/10 shadow-3xl">
                <span className="text-[12px] font-black text-white">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div className="absolute left-full ml-6 px-5 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 pointer-events-none shadow-3xl z-50 transform translate-x-[-10px] group-hover:translate-x-0 ring-1 ring-inset ring-white/[0.01]">
              Identity_Vault
            </div>
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="relative flex items-center justify-center w-full aspect-square rounded-2xl transition-all duration-700 group hover:bg-red-500/5 text-muted-foreground/10 hover:text-red-400/60"
          >
            <LogOut className="w-5 h-5 transition-all duration-700 group-hover:scale-110" />
            <div className="absolute left-full ml-6 px-5 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-red-400/60 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 pointer-events-none shadow-3xl z-50 transform translate-x-[-10px] group-hover:translate-x-0 ring-1 ring-inset ring-white/[0.01]">
              TERMINATE_LINK
            </div>
          </button>

          {/* Infrastructure Health Indicator */}
          <div className="pt-2 pb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Epistemic Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-md" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
