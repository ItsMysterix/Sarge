"use client"

import { useState } from "react"
import { Globe, Plus, Trash2, ExternalLink, ShieldCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

export function DomainsTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const [newHostname, setNewHostname] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  const domainsQuery = t.domains?.list?.useQuery(
    { projectId: currentProject?.id },
    { enabled: !!currentProject?.id }
  )
  
  const addMutation = t.domains?.add?.useMutation({
    onSuccess: () => {
      domainsQuery?.refetch()
      setNewHostname("")
      setIsAdding(false)
      addToast({ type: "success", title: "Domain added", description: "Now verify your DNS records" })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Add failed", description: err.message })
    }
  })
  
  const deleteMutation = t.domains?.delete?.useMutation({
    onSuccess: () => {
      domainsQuery?.refetch()
      addToast({ type: "success", title: "Domain removed" })
    }
  })

  const verifyMutation = t.domains?.verify?.useMutation({
    onSuccess: (data: any) => {
      domainsQuery?.refetch()
      if (data.success) {
        addToast({ type: "success", title: "Verified", description: data.message })
      } else {
        addToast({ type: "warning", title: "Incomplete", description: data.message })
      }
    }
  })

  const handleAdd = () => {
    if (!newHostname || !currentProject?.id) return
    addMutation?.mutate({
      projectId: currentProject.id,
      hostname: newHostname
    })
  }

  const domains = domainsQuery?.data || []

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
             <Globe className="w-6 h-6 text-white/40" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Domains & Ingress</h2>
            <p className="text-xs text-white/20 mt-0.5">Configure hostnames and DNS settings for your services.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          size="sm"
          className="h-9 px-4 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5 mr-2" /> Add Domain
        </Button>
      </div>

      {/* Add Domain Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 mb-8 shadow-2xl">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block ml-1">Domain Name</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value.toLowerCase())}
                    placeholder="app.example.com"
                    className="flex-1 bg-black border border-white/5 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:border-white/20 transition-all text-white/80 placeholder:text-white/5"
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={!newHostname || addMutation?.isLoading}
                    className="h-11 px-8 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
                  >
                    {addMutation?.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect Domain"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domains List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl divide-y divide-white/[0.02] shadow-xl overflow-hidden">
        {domainsQuery?.isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/5" />
          </div>
        ) : domains.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center mb-6">
              <Globe className="w-8 h-8 text-white/5" />
            </div>
            <h3 className="text-sm font-bold text-white/20 uppercase tracking-widest">No domains connected</h3>
            <p className="text-xs text-white/10 mt-2 max-w-xs leading-relaxed">Add a custom domain to point your application to a professional URL.</p>
          </div>
        ) : (
          domains.map((domain: any) => (
            <div key={domain.id} className="p-8 space-y-8 hover:bg-white/[0.01] transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-1.5 h-1.5 rounded-full", domain.is_verified ? "bg-emerald-500 shadow-lg" : "bg-amber-500 animate-pulse")} />
                  <div className="text-sm font-bold text-white/80 uppercase tracking-widest">{domain.hostname}</div>
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5",
                    domain.is_verified ? "border-emerald-500/10 text-emerald-400/60 bg-emerald-500/5" : "border-amber-500/10 text-amber-400/60 bg-amber-500/5"
                  )}>
                    {domain.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => verifyMutation?.mutate({ domainId: domain.id })}
                    disabled={verifyMutation?.isLoading}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 text-white/10 hover:text-white hover:bg-white/5 transition-all"
                    title="Check DNS Status"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", verifyMutation?.isLoading && "animate-spin")} />
                  </button>
                  <button
                    onClick={() => deleteMutation?.mutate({ domainId: domain.id })}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 text-white/10 hover:text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!domain.is_verified && (
                <div className="bg-black border border-white/5 rounded-2xl p-6 space-y-6">
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest border-b border-white/5 pb-4">Configuration Requirements</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: 'Type', val: 'CNAME' },
                      { label: 'Host', val: '@' },
                      { label: 'Value', val: 'ingress.sarge.io', technical: true }
                    ].map(rec => (
                      <div key={rec.label} className="space-y-1">
                         <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{rec.label}</div>
                         <div className={cn("text-xs font-bold uppercase tracking-wider font-mono", rec.technical ? "text-white/80" : "text-white/40")}>{rec.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-white/20 italic">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-medium uppercase tracking-widest">DNS propagation may take up to 24-48 hours.</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SSL Notice */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row gap-6 items-center">
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
           <ShieldCheck className="w-6 h-6 text-white/20" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Managed SSL/TLS</h4>
          <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest leading-relaxed">
            Certificates are automatically provisioned and renewed via Let&apos;s Encrypt for all connected domains.
          </p>
        </div>
      </div>
    </div>
  )
}
