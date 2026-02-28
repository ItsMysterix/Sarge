"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Layers,
  Activity, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  FolderKanban
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/project-context"
import { useUser, useAuth } from "@/lib/clerk-safe"

const projectNavigation = [
  { name: "Orchestration", href: "/orchestration", icon: Layers },
  { name: "Observability", href: "/observability", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
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
        className="lg:hidden fixed top-6 left-6 z-50 w-10 h-10 flex items-center justify-center bg-[#0a0a0a] border border-white/5 rounded-xl text-muted-foreground/40"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-20 flex flex-col pt-8 items-center gap-10",
          "bg-[#0a0a0a] border-r border-white/5 shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static"
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center justify-center">
          <Link href="/projects" className="group">
            <div className="w-12 h-12 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center shadow-lg group-hover:border-white/10 transition-all">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/40 group-hover:text-white transition-colors">
                 <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col w-full px-3">
          <ul className="space-y-4 flex flex-col items-center w-full">
            <li className="w-full">
              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "w-full aspect-square flex items-center justify-center rounded-2xl transition-all group relative",
                  pathname === "/projects" 
                    ? "bg-white/[0.05] text-white border border-white/10" 
                    : "text-muted-foreground/30 hover:text-white"
                )}
              >
                <FolderKanban className="w-5 h-5" />
                {pathname === "/projects" && <div className="absolute -left-1 w-1 h-6 bg-indigo-500 rounded-full" />}
              </Link>
            </li>

            {currentProject && projectNavigation.map((item) => {
              const Icon = item.icon
              const fullHref = `/projects/${currentProject.slug}${item.href}`
              const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/')
              
              return (
                <li key={item.name} className="w-full">
                  <Link
                    href={fullHref}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "w-full aspect-square flex items-center justify-center rounded-2xl transition-all group relative",
                      isActive 
                        ? "bg-white/[0.05] text-white border border-white/10" 
                        : "text-muted-foreground/30 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && <div className="absolute -left-1 w-1 h-6 bg-indigo-500 rounded-full" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Actions */}
        <div className="mt-auto p-4 w-full flex flex-col items-center gap-6 pb-8">
          <Link 
            href="/profile"
            className="group relative flex items-center justify-center w-full"
          >
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                className="w-10 h-10 rounded-xl border border-white/5 opacity-50 group-hover:opacity-100 transition-all"
                alt="Profile"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                <span className="text-[10px] font-bold text-white/40">{user?.firstName?.[0]}</span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="text-muted-foreground/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
