"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { trpc } from "@/lib/trpc"
import { ArrowLeft, Box, Database, MessageSquare, Search, Plus, Layers, Cloud, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const iconMap: Record<string, any> = {
  Database,
  MessageSquare,
  Box,
  Search,
}

const CATEGORIES = ["All", "Databases", "Messaging", "Storage", "Search"]

export default function AddonsMarketplacePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  const projectSlug = params.slug

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const addonsQuery = trpc.addons.listAvailable.useQuery()
  const provisionMutation = trpc.addons.provisionAddon.useMutation({
    onSuccess: (data) => {
      addToast({ title: "Provisioning Started", description: data.message, type: "success" })
      setTimeout(() => router.push(`/projects/${projectSlug}`), 1500)
    },
    onError: (error) => {
      addToast({ title: "Provisioning Failed", description: error.message, type: "error" })
    }
  })

  if (addonsQuery.isLoading) {
    return (
      <AppShell title="Marketplace">
        <LoadingScreen title="Loading Marketplace" subtitle="Fetching verified infrastructure modules..." />
      </AppShell>
    )
  }

  const addons = addonsQuery.data || []
  const filteredAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(search.toLowerCase()) || 
                          addon.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === "All" || addon.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleInstall = (addonId: string) => {
    provisionMutation.mutate({ projectId: projectSlug, addonId })
  }

  return (
    <AppShell title="Marketplace">
      <div className="flex-1 p-8 lg:p-12 max-w-[1700px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-700">
        <ToastContainer />

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">BYOC Verified</span>
               </div>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Available Add-ons</h1>
            <p className="text-sm text-white/20 max-w-2xl leading-relaxed">
              Instantly provision stateful workloads and databases directly into your connected cloud infrastructure with zero configuration.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-full sm:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search modules..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-11 pl-11 pr-4 bg-white/[0.02] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all placeholder:text-white/10"
               />
            </div>
            <Button variant="outline" className="h-11 px-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold uppercase tracking-widest rounded-xl transition-all w-full sm:w-auto" onClick={() => router.push(`/projects/${projectSlug}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Node
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap",
                activeCategory === cat 
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                  : "bg-white/[0.01] text-white/20 border-white/5 hover:text-white/40 hover:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredAddons.map((addon, idx) => {
              const IconComponent = iconMap[addon.icon] || Layers
              
              return (
                <motion.div 
                  layout
                  key={addon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex flex-col hover:border-white/15 transition-all group shadow-2xl relative overflow-hidden ring-1 ring-inset ring-white/[0.01]"
                >
                  {/* Glowing background on hover */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-[60px] pointer-events-none group-hover:bg-white/[0.03] transition-all duration-700" />
                  
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-xl group-hover:bg-white/[0.05] transition-all duration-500 relative">
                      <div className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.05)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                      <IconComponent className="w-7 h-7 text-white/20 group-hover:text-white transition-colors duration-500 relative z-10" />
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/[0.02] text-emerald-400/40 border-emerald-500/10 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1">
                      {addon.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mb-10 flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">{addon.name}</h3>
                    <p className="text-xs text-white/20 leading-relaxed font-medium">
                      {addon.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/5 pt-8">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] mb-1">Pricing Model</span>
                      <span className="text-sm font-bold text-white/60 tabular-nums">
                        {addon.price === 0 ? 'FREE' : `$${addon.price}.00`}
                        <span className="text-[10px] text-white/10 ml-1 font-medium">/MO</span>
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleInstall(addon.id)}
                      disabled={provisionMutation.isLoading}
                      className="bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[9px] px-6 h-9 rounded-xl transition-all active:scale-95 shadow-xl"
                    >
                      {provisionMutation.isLoading ? (
                        <Zap className="w-3 h-3 animate-pulse" />
                      ) : (
                        "Install"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredAddons.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]"
            >
              <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <Search className="w-10 h-10 text-white/5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Modules Found</h3>
                <p className="text-sm text-white/20">Try adjusting your search filters or category registry.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
