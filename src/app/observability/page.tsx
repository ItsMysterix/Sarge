"use client"
export const dynamic = "force-dynamic"

import { Activity, Terminal, History, Box, Layers, ShieldAlert, Lock, Database, ShieldCheck, Bell, HeartPulse, Waypoints } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { useProject } from "@/lib/project-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  if (!currentProject) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[50vh]">
          <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-bold tracking-tight">No Project Selected</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">Select a project from the sidebar to view observability data.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold tracking-tight">Observability</span>
      </div>
    }>
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full animate-fade-in">
        <Tabs defaultValue="telemetry" className="w-full space-y-8">
          <TabsList className="bg-transparent h-auto p-0 gap-6 border-b border-border w-full justify-start rounded-none overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent shadow-none gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground/80"
              >
                <tab.icon className="w-3.5 h-3.5 mb-0.5" />
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-[500px]">
            <TabsContent value="telemetry" className="m-0">
              <TelemetrySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="activity" className="m-0">
              <ActivitySection slug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="inventory" className="m-0">
              <InventorySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="services" className="m-0">
              <ServicesSection />
            </TabsContent>
            <TabsContent value="alerts" className="m-0">
              <AlertsSection projectId={currentProject.id} />
            </TabsContent>
            <TabsContent value="health" className="m-0">
              <HealthSection projectId={currentProject.id} />
            </TabsContent>
            <TabsContent value="traces" className="m-0">
              <TracesSection />
            </TabsContent>
            <TabsContent value="security" className="m-0">
              <SecuritySection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="audit" className="m-0">
              <AuditSection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="infra" className="m-0">
              <InfraSection projectSlug={currentProject.slug} />
            </TabsContent>
            <TabsContent value="compliance" className="m-0">
              <ComplianceSection projectId={currentProject.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  )
}
