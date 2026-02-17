"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { 
  GitBranch, 
  Layout,
  Plus,
  Box,
  ShieldCheck,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { GridLoader } from "@/components/ui/grid-loader"
import { useProject } from "@/lib/project-context"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { currentProject } = useProject()
  const { addToast, ToastContainer } = useToast()
  
  // We can use the context project or fetch specific
  const projectSlug = params.slug

  // In a real app we might fetch more dashboard-specific stats here
  
  const displayProject = currentProject || {
    name: projectSlug,
    slug: projectSlug,
  }

  return (
    <AppShell>
      <div className="flex-1 p-6 max-w-6xl mx-auto animate-fade-in">
        <ToastContainer />
        
        {/* Actions Header */}
        <div className="mb-8 flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight">{displayProject.name}</h1>
               <p className="text-sm text-muted-foreground font-mono mt-1">{displayProject.slug}</p>
            </div>
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => router.push('/settings')}>
                  Project Settings
               </Button>
               <Button className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" /> New Deployment
               </Button>
             </div>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/30 w-full sm:w-auto justify-start border border-border rounded-lg p-1 mb-8">
            <TabTrigger value="overview" icon={<Layout className="w-3.5 h-3.5" />} label="Overview" />
            <TabTrigger value="rules" icon={<GitBranch className="w-3.5 h-3.5" />} label="Deployment Rules" />
          </TabsList>

          {/* Overview Tab (Environments & Status) */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Stats / Health (Mock) */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-card border border-border p-4 rounded-xl">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Deployments</div>
                    <div className="text-2xl font-semibold text-foreground">24</div>
                 </div>
                 <div className="bg-card border border-border p-4 rounded-xl">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Avg. Build Time</div>
                    <div className="text-2xl font-semibold text-foreground">1m 42s</div>
                 </div>
                 <div className="bg-card border border-border p-4 rounded-xl">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Success Rate</div>
                    <div className="text-2xl font-semibold text-emerald-500">98.5%</div>
                 </div>
                 <div className="bg-card border border-border p-4 rounded-xl">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Active Services</div>
                    <div className="text-2xl font-semibold text-foreground">3</div>
                 </div>
              </div>

              {/* Environments Area */}
              <div className="md:col-span-2 space-y-4">
                 <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Box className="w-4 h-4" /> Environments
                 </h3>
                 <div className="min-h-[300px] flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl bg-muted/5 p-8">
                    <div className="p-4 rounded-full bg-muted/30 mb-4">
                       <Layout className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1 text-foreground">No Active Environments</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mb-6">
                      You haven't deployed any environments yet. Start by creating your first environment.
                    </p>
                    <Button onClick={() => router.push('/orchestration')} className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90">
                       <Plus className="w-4 h-4 mr-2" />
                       Create Environment
                    </Button>
                </div>
              </div>

              {/* Recent Activity / Side Panel */}
              <div className="space-y-4">
                 <h3 className="font-semibold text-foreground">Recent Activity</h3>
                 <div className="bg-card border border-border rounded-xl p-4 min-h-[300px]">
                    <div className="space-y-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="flex gap-3 items-start">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-muted-foreground/50" />
                            <div>
                               <p className="text-sm text-foreground">Project created</p>
                               <p className="text-xs text-muted-foreground">2 days ago by You</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </TabsContent>

          {/* Deployment Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
             <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <div>
                     <h3 className="font-semibold text-foreground">Branch Protection Rules</h3>
                     <p className="text-sm text-muted-foreground">Control how code is deployed to your environments.</p>
                   </div>
                   <Button variant="outline" size="sm" className="text-xs">Add Rule</Button>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="w-4 h-4 text-emerald-500" />
                         <div>
                            <p className="text-sm font-medium text-foreground">Production Freeze</p>
                            <p className="text-xs text-muted-foreground">Main branch requires approval before promotion</p>
                         </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function TabTrigger({ value, icon, label }: { value: string, icon: any, label: string }) {
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "text-muted-foreground hover:text-foreground hover:bg-background/50"
      )}
    >
      {icon}
      <span>{label}</span>
      </TabsTrigger>
  )
}
