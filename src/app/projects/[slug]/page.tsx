"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { 
  GitBranch, 
  Github, 
  ArrowUpRight,
  Box,
  Layout,
  Settings as SettingsIcon,
  Key,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { data, isLoading } = trpc.project.list.useQuery()
  const project = data?.projects?.find((p: any) => p.slug === params.slug)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
  
  // Use mock data if project not found for preview purposes, or show error
  const displayProject = project || {
    name: params.slug,
    slug: params.slug,
    framework: 'nextjs',
    status: 'active'
  }

  return (
    <AppShell>
      <div className="flex-1 p-8 overflow-y-auto animate-fade-in">
        <div className="max-w-6xl mx-auto">
          
          {/* Project Hero */}
          <div className="mb-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{displayProject.name.substring(0,2).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{displayProject.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                     <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] uppercase tracking-wider px-2 py-0">Running</Badge>
                     <a href="#" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
                       {displayProject.slug}.vercel.app <ArrowUpRight className="w-3 h-3" />
                     </a>
                  </div>
                </div>
             </div>
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/50">
                <Plus className="w-4 h-4 mr-2" /> New Deployment
             </Button>
          </div>

          {/* Custom Tabs */}
          <Tabs defaultValue="environments" className="w-full">
            <TabsList className="bg-transparent w-full justify-start border-b border-white/5 rounded-none h-auto p-0 mb-8 space-x-8">
              <TabTrigger value="environments" icon={<Layout className="w-4 h-4" />} label="Environments" />
              <TabTrigger value="rules" icon={<GitBranch className="w-4 h-4" />} label="Deployment rules" />
              <TabTrigger value="variables" icon={<Key className="w-4 h-4" />} label="Variables" />
              <TabTrigger value="settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
            </TabsList>

            <TabsContent value="environments" className="space-y-6">
              
              {/* Empty State / Cluster Prompt (As styled in screenshot) */}
              <div className="min-h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full" />
                     <div className="relative glass-panel rounded-2xl p-8 border-white/10 w-64 h-48 flex flex-col gap-3 rotate-3 transform shadow-2xl">
                        <div className="h-2 w-12 bg-white/10 rounded-full" />
                        <div className="h-2 w-32 bg-white/10 rounded-full mb-4" />
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center self-end">
                           <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                     </div>
                     <div className="absolute top-4 -left-4 glass-panel rounded-2xl p-8 border-white/10 w-64 h-48 flex flex-col gap-3 -rotate-3 transform z-[-1] opacity-50 scale-95">
                        {/* Ghost card */}
                     </div>
                  </div>
                  
                  <h3 className="text-xl font-medium mb-2">Create your Environment first ⚡️</h3>
                  <p className="text-muted-foreground text-sm max-w-md mb-8">
                    Deploying an environment is necessary to start managing your application lifecycle.
                  </p>
                  <Button className="h-10 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-t border-white/20">
                     <Plus className="w-4 h-4 mr-2" />
                     Create Environment
                  </Button>
              </div>

            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}

function TabTrigger({ value, icon, label }: { value: string, icon: any, label: string }) {
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all",
        "text-muted-foreground data-[state=active]:text-foreground hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </TabsTrigger>
  )
}
