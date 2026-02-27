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
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-24 min-h-[85vh] bg-[#050505] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.02),transparent_60%)] pointer-events-none" />
          <div className="w-24 h-24 rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 flex items-center justify-center mb-12 shadow-3xl relative group ring-1 ring-inset ring-white/[0.01] transition-all duration-1000 hover:scale-110">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
            <Activity className="w-12 h-12 text-muted-foreground/10 group-hover:text-indigo-400/40 relative z-10 transition-colors duration-1000" />
          </div>
          <h2 className="text-[18px] font-black tracking-[0.6em] text-foreground/90 mb-6 uppercase">Telemetry_Lock_Engaged</h2>
          <p className="text-[10px] font-black text-muted-foreground/10 max-w-sm leading-relaxed uppercase tracking-[0.4em] mb-16">
            Initialize an operational node protocol to establish a telemetry uplink and access high-fidelity infrastructure metrics.
          </p>
          <Button 
            className="bg-white text-black hover:bg-zinc-200 h-14 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95"
            onClick={() => (window as any).nextRouter?.push('/projects')}
          >
            Sovereign_Node_Registry
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-inset ring-white/[0.01]">
          <Activity className="w-6 h-6 text-indigo-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-black tracking-[0.5em] uppercase text-foreground/90">Intelligence_Observatory_Nexus</span>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            {currentProject.name}_Node // High_Fidelity_Uplink_v4.2
          </span>
        </div>
      </div>
    }>
      <div className="flex-1 p-10 lg:p-14 max-w-[1900px] mx-auto w-full flex flex-col gap-16 animate-in fade-in duration-1000">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-16">
          <div className="border-b border-white/5 relative">
            <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <TabsList className="bg-transparent h-auto p-0 gap-12 justify-start rounded-none overflow-x-auto no-scrollbar pb-6">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-0 py-2 rounded-none border-none bg-transparent shadow-none gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10 data-[state=active]:text-foreground transition-all hover:text-muted-foreground/30 relative group"
                >
                  <tab.icon className={cn("w-4 h-4 transition-all duration-700", activeTab === tab.id ? "text-indigo-400 scale-110" : "group-hover:scale-110")} />
                  <span className="hidden sm:inline-block">{tab.name}_SENSOR</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute -bottom-6 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10" 
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[800px] animate-in slide-in-from-bottom-8 duration-1000">
            <TabsContent value="telemetry" className="m-0 focus-visible:outline-none">
              <TelemetrySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="activity" className="m-0 focus-visible:outline-none">
              <ActivitySection slug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="inventory" className="m-0 focus-visible:outline-none">
              <InventorySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="services" className="m-0 focus-visible:outline-none">
              <ServicesSection />
            </TabsContent>
            <TabsContent value="alerts" className="m-0 focus-visible:outline-none">
              <AlertsSection projectId={currentProject.id} />
            </TabsContent>
            <TabsContent value="health" className="m-0 focus-visible:outline-none">
              <HealthSection projectId={currentProject.id} />
            </TabsContent>
            <TabsContent value="traces" className="m-0 focus-visible:outline-none">
              <TracesSection />
            </TabsContent>
            <TabsContent value="security" className="m-0 focus-visible:outline-none">
              <SecuritySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="audit" className="m-0 focus-visible:outline-none">
              <AuditSection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="infra" className="m-0 focus-visible:outline-none">
              <InfraSection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="compliance" className="m-0 focus-visible:outline-none">
              <ComplianceSection projectId={currentProject.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  )
}
