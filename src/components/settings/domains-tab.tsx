"use client"

import { useState } from "react"
import { Globe, Plus, Trash2, ExternalLink, ShieldCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/observatory/empty-state"

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
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
             <Globe className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Ingress & Edge Mesh</h2>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Configure external hostnames & L7 load balancing protocols</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Assign Hostname
        </Button>
      </div>

      {/* Add Domain Form */}
      {isAdding && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">TARGET_HOSTNAME_ENDPOINT</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value.toLowerCase())}
                placeholder="APP.REDACTED.NETWORK"
                className="flex-1 bg-[#050505] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] font-mono outline-none focus:border-emerald-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5"
              />
              <Button
                onClick={handleAdd}
                disabled={!newHostname || addMutation?.isLoading}
                className="h-12 px-10 bg-emerald-500 text-white hover:bg-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                {addMutation?.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sync_Mesh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] divide-y divide-white/5 shadow-xl overflow-hidden">
        {domainsQuery?.isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500/20" />
          </div>
        ) : domains.length === 0 ? (
          <EmptyState 
            icon={Globe} 
            title="Mesh Void" 
            subtitle="No hostnames registered within the ingress routing matrix" 
          />
        ) : (
          domains.map((domain: any) => (
            <div key={domain.id} className="p-10 space-y-10 hover:bg-white/[0.01] transition-all duration-500 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                  <div className="text-[13px] font-black text-foreground/80 uppercase tracking-widest">{domain.hostname}</div>
                  {domain.is_verified ? (
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] h-6 px-3 bg-emerald-500/5 text-emerald-400/60 border-emerald-500/10">
                      ACTIVE_ROUTING
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] h-6 px-3 bg-amber-500/5 text-amber-400/60 border-amber-500/10 animate-pulse">
                      DNS_PROPAGATION_PENDING
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => verifyMutation?.mutate({ domainId: domain.id })}
                    disabled={verifyMutation?.isLoading}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 text-muted-foreground/20 hover:text-foreground/60 hover:bg-white/5 transition-all duration-500"
                    title="Refresh Mesh Status"
                  >
                    <RefreshCw className={cn("w-4 h-4", verifyMutation?.isLoading && "animate-spin")} />
                  </button>
                  <button
                    onClick={() => deleteMutation?.mutate({ domainId: domain.id })}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 text-muted-foreground/20 hover:text-red-400/60 hover:bg-red-500/5 transition-all duration-500"
                    title="Purge Routing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!domain.is_verified && (
                <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 space-y-8 ring-1 ring-inset ring-white/[0.01]">
                  <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] border-b border-white/5 pb-4">DNS_CONFIGURATION_MANIFEST</div>
                  <div className="grid grid-cols-3 gap-8">
                    {[
                      { label: 'RECORD_TYPE', val: 'CNAME' },
                      { label: 'HOST_TARGET', val: '@' },
                      { label: 'MESH_ENDPOINT', val: 'CNAME.SARGE-INGRESS.IO', technical: true }
                    ].map(rec => (
                      <div key={rec.label} className="space-y-2">
                         <div className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-widest">{rec.label}</div>
                         <div className={cn("text-[11px] font-mono font-black uppercase tracking-widest", rec.technical ? "text-emerald-400/60" : "text-foreground/40")}>{rec.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex items-center gap-3 text-amber-500/40">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Global propagation may consume up to 48 hours of cycle time.</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SSL Notice */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl flex gap-8 items-center border-emerald-500/5">
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
           <ShieldCheck className="w-6 h-6 text-emerald-400/40" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em]">Automated SSL Certification</div>
          <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-relaxed">
            Sarge automatically provisions and renews Let's Encrypt certificates for all verified domains within the mesh routing layer.
          </p>
        </div>
      </div>
    </div>
  )
}
