"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { ArrowLeft, Box, Database, MessageSquare, Search, Plus, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"

const iconMap: Record<string, any> = {
  Database,
  MessageSquare,
  Box,
  Search,
}

export default function AddonsMarketplacePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  
  const projectSlug = params.slug

  const addonsQuery = trpc.addons.listAvailable.useQuery()
  const provisionMutation = trpc.addons.provisionAddon.useMutation({
    onSuccess: (data) => {
      addToast({ title: "Provisioning Started", description: data.message, type: "success" })
      setTimeout(() => router.push(`/projects/${projectSlug}`), 2000)
    },
    onError: (error) => {
      addToast({ title: "Provisioning Failed", description: error.message, type: "error" })
    }
  })

  if (addonsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingScreen title="Loading Add-ons" subtitle="Fetching marketplace catalog..." />
      </AppShell>
    )
  }

  const addons = addonsQuery.data || []

  const handleInstall = (addonId: string) => {
    provisionMutation.mutate({ projectId: projectSlug, addonId })
  }

  return (
    <AppShell title={
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-inset ring-white/[0.01]">
          <Layers className="w-6 h-6 text-emerald-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-black tracking-[0.5em] uppercase text-foreground/90">Modular_Addon_Registry</span>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            Active_Marketplace_Link // BYOC_Provisioning_Enabled
          </span>
        </div>
      </div>
    }>
      <div className="flex-1 p-10 lg:p-14 max-w-[1700px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-1000">
        <ToastContainer />

        <div className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase tracking-widest">Mesh_Addon_Extension_Matrix</h1>
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] max-w-2xl leading-relaxed">
              Instantly provision stateful workloads, databases, and message brokers directly into your connected Bring-Your-Own-Cloud infrastructure.
            </p>
          </div>
          <Button variant="outline" className="h-12 px-8 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all" onClick={() => router.push(`/projects/${projectSlug}`)}>
            <ArrowLeft className="w-4 h-4 mr-3" /> Abort_Marketplace
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {addons.map((addon) => {
            const IconComponent = iconMap[addon.icon] || Layers
            
            return (
              <div key={addon.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col hover:border-emerald-500/20 transition-all duration-700 group ring-1 ring-inset ring-white/[0.01] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] blur-[60px] pointer-events-none" />
                
                <div className="flex items-start justify-between mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-xl group-hover:bg-emerald-500/5 group-hover:border-emerald-500/10 transition-all duration-700">
                    <IconComponent className="w-7 h-7 text-muted-foreground/20 group-hover:text-emerald-400 transition-colors duration-700" />
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Verified_Module</span>
                  </div>
                </div>
                
                <h3 className="text-[16px] font-black text-foreground/90 uppercase tracking-[0.1em] mb-4 group-hover:text-foreground transition-colors">{addon.name}</h3>
                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest leading-relaxed mb-10 flex-1">{addon.description}</p>
                
                <Button 
                  className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl transition-all active:scale-95"
                  onClick={() => handleInstall(addon.id)}
                  disabled={provisionMutation.isLoading}
                >
                  {provisionMutation.isLoading ? "INITIALIZING..." : "MANIFEST_MODULE"}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
