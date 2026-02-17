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
  Plus,
  Shield,
  Trash2,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { GridLoader } from "@/components/ui/grid-loader"

export default function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  const { data, isLoading } = trpc.project.list.useQuery()
  const project = data?.projects?.find((p: any) => p.slug === params.slug)
  
  // Placeholder state for variables
  const [variables, setVariables] = useState([
    { key: "DATABASE_URL", value: "***************", env: "Production" },
    { key: "API_KEY", value: "***************", env: "All" }
  ])

  if (isLoading) return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <GridLoader className="w-10 h-10 text-muted-foreground" />
      </div>
    </AppShell>
  )
  
  const displayProject = project || {
    name: params.slug,
    slug: params.slug,
    framework: 'nextjs',
    status: 'active'
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
             <Button className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="w-4 h-4 mr-2" /> New Deployment
             </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="environments" className="w-full">
          <TabsList className="bg-muted/30 w-full sm:w-auto justify-start border border-border rounded-lg p-1 mb-8">
            <TabTrigger value="environments" icon={<Layout className="w-3.5 h-3.5" />} label="Environments" />
            <TabTrigger value="rules" icon={<GitBranch className="w-3.5 h-3.5" />} label="Deployment Rules" />
            <TabTrigger value="variables" icon={<Key className="w-3.5 h-3.5" />} label="Variables" />
            <TabTrigger value="settings" icon={<SettingsIcon className="w-3.5 h-3.5" />} label="Settings" />
          </TabsList>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-6">
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500 border border-dashed border-border rounded-xl bg-muted/5">
                <div className="p-6 rounded-full bg-muted/30 mb-6">
                   <Box className="w-10 h-10 text-muted-foreground" />
                </div>
                
                <h3 className="text-lg font-medium mb-2 text-foreground">Create your Environment first</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-8">
                  Deploying an environment is necessary to start managing your application lifecycle.
                </p>
                <Button className="h-10 px-6 bg-foreground text-background hover:bg-foreground/90">
                   <Plus className="w-4 h-4 mr-2" />
                   Create Environment
                </Button>
            </div>
          </TabsContent>

          {/* Deployment Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
             <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-semibold text-foreground">Branch Protection</h3>
                   <Button variant="outline" size="sm" className="text-xs">Add Rule</Button>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                         <GitBranch className="w-4 h-4 text-muted-foreground" />
                         <div>
                            <p className="text-sm font-medium text-foreground">main</p>
                            <p className="text-xs text-muted-foreground">Require approval for production deployments</p>
                         </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                   </div>
                </div>
             </div>
          </TabsContent>

           {/* Variables Tab */}
           <TabsContent value="variables" className="space-y-6">
             <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-semibold text-foreground">Environment Variables</h3>
                   <Button size="sm" className="text-xs bg-foreground text-background hover:bg-foreground/90"><Plus className="w-3.5 h-3.5 mr-2" /> Add Variable</Button>
                </div>
                <div className="space-y-1">
                   <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                      <div className="col-span-4">Key</div>
                      <div className="col-span-5">Value</div>
                      <div className="col-span-3">Environment</div>
                   </div>
                   {variables.map((v, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg border border-border items-center">
                         <div className="col-span-4 font-mono text-sm text-foreground">{v.key}</div>
                         <div className="col-span-5 font-mono text-xs text-muted-foreground">{v.value}</div>
                         <div className="col-span-3 flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px]">{v.env}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><SettingsIcon className="w-3 h-3" /></Button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
             <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">General Settings</h3>
                <div className="grid gap-4 max-w-xl">
                   <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Project Name</label>
                      <div className="flex gap-3">
                         <Input value={displayProject.name} disabled className="bg-muted/30 border-border" />
                         <Button variant="outline">Rename</Button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                   Deleting this project will permanently remove all associated resources, deployments, and data.
                </p>
                <Button variant="destructive" size="sm">
                   <Trash2 className="w-4 h-4 mr-2" /> Delete Project
                </Button>
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
