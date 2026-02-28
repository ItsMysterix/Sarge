"use client"
export const dynamic = "force-dynamic"

import { motion } from "framer-motion"
import { Activity, Terminal, History, Box, Layers, ShieldAlert, Lock, Database, ShieldCheck, Bell, HeartPulse, Waypoints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/layout/app-shell"
import { useProject } from "@/lib/project-context"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  TelemetrySection,
  ActivitySection,
  InventorySection,
  ServicesSection,
  SecuritySection,
  AuditSection,
  InfraSection,
  ComplianceSection,
  AlertsSection,
  HealthSection,
  TracesSection,
} from "@/components/observatory"

const TABS = [
  { id: 'telemetry', name: 'Telemetry', icon: Terminal },
  { id: 'activity', name: 'Activity', icon: History },
  { id: 'inventory', name: 'Inventory', icon: Box },
  { id: 'services', name: 'Services', icon: Layers },
  { id: 'alerts', name: 'Alerts', icon: Bell },
  { id: 'health', name: 'Health', icon: HeartPulse },
  { id: 'traces', name: 'Traces', icon: Waypoints },
  { id: 'security', name: 'Security', icon: ShieldAlert },
  { id: 'audit', name: 'Audit', icon: Lock },
  { id: 'infra', name: 'Infrastructure', icon: Database },
  { id: 'compliance', name: 'Costs', icon: ShieldCheck },
] as const

export default function ObservatoryHub() {
  const { currentProject } = useProject()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("telemetry")

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  if (!currentProject) {
    return (
      <AppShell title="Observatory">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-24 min-h-[85vh] bg-[#050505] animate-in fade-in duration-700">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 shadow-xl">
            <Activity className="w-8 h-8 text-white/10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">No Project Selected</h2>
          <p className="text-xs text-white/20 max-w-sm leading-relaxed mb-10 uppercase font-bold tracking-widest">
            Select a project to access real-time status and monitoring data across your infrastructure.
          </p>
          <Button 
            className="bg-white text-black hover:bg-zinc-200 h-10 px-8 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            onClick={() => (window as any).nextRouter?.push('/projects')}
          >
            Go to Projects
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Observability">
      <div className="flex-1 p-8 lg:p-12 max-w-[1900px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-12">
          <div className="border-b border-white/5">
            <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start rounded-none overflow-x-auto no-scrollbar pb-4 text-white/20">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "bg-transparent border-none p-0 flex items-center gap-2.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none group transition-all",
                    "text-[10px] font-bold uppercase tracking-widest hover:text-white/40",
                    "data-[state=active]:text-white -mb-[17px] pb-4 border-b-2 data-[state=active]:border-white border-transparent"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <TabsContent value="telemetry" className="mt-0 outline-none"><TelemetrySection projectSlug={currentProject.slug} /></TabsContent>
            <TabsContent value="activity" className="mt-0 outline-none"><ActivitySection slug={currentProject.slug} /></TabsContent>
            <TabsContent value="inventory" className="mt-0 outline-none"><InventorySection projectSlug={currentProject.slug} /></TabsContent>
            <TabsContent value="services" className="mt-0 outline-none"><ServicesSection /></TabsContent>
            <TabsContent value="alerts" className="mt-0 outline-none"><AlertsSection projectId={currentProject.id} /></TabsContent>
            <TabsContent value="health" className="mt-0 outline-none"><HealthSection projectId={currentProject.id} /></TabsContent>
            <TabsContent value="traces" className="mt-0 outline-none"><TracesSection /></TabsContent>
            <TabsContent value="security" className="mt-0 outline-none"><SecuritySection projectSlug={currentProject.slug} /></TabsContent>
            <TabsContent value="audit" className="mt-0 outline-none"><AuditSection projectSlug={currentProject.slug} /></TabsContent>
            <TabsContent value="infra" className="mt-0 outline-none"><InfraSection projectSlug={currentProject.slug} /></TabsContent>
            <TabsContent value="compliance" className="mt-0 outline-none"><ComplianceSection projectId={currentProject.id} /></TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </AppShell>
  )
}
