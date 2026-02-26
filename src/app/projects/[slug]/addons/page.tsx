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
    <AppShell title="Marketplace">
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full animate-fade-in bg-background">
        <ToastContainer />

        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => router.push(`/projects/${projectSlug}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
        </Button>

        <div className="mb-10">
          <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Nango Powered
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight mb-2">1-Click Add-ons Marketplace</h1>
          <p className="text-muted-foreground max-w-2xl">
            Instantly provision stateful workloads, databases, and message brokers directly into your connected Bring-Your-Own-Cloud (BYOC) infrastructure. All credentials and network paths are automatically negotiated via Nango.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons.map((addon) => {
            const IconComponent = iconMap[addon.icon] || Layers
            
            return (
              <div key={addon.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:border-emerald-500/30 transition-all duration-300 group shadow-sm hover:shadow-emerald-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-emerald-500/10 transition-colors">
                    <IconComponent className="w-6 h-6 text-foreground group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <Badge variant="secondary" className="bg-white/5 border-none font-medium">Verified</Badge>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">{addon.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{addon.description}</p>
                
                <Button 
                  className="w-full bg-white text-black hover:bg-white/90 font-bold"
                  onClick={() => handleInstall(addon.id)}
                  disabled={provisionMutation.isLoading}
                >
                  {provisionMutation.isLoading ? "Provisioning..." : <><Plus className="w-4 h-4 mr-2" /> Install Add-on</>}
                </Button>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
