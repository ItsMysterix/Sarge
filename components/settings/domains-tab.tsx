"use client"

import { useState } from "react"
import { Globe, Plus, Trash2, ExternalLink, ShieldCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            Custom Domains
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure custom hostnames and SSL for your applications.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {/* Add Domain Form */}
      {isAdding && (
        <div className="glass-card p-4 space-y-4 border border-white/10">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Hostname</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value.toLowerCase())}
                placeholder="app.example.com"
                className="flex-1 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleAdd}
                disabled={!newHostname || addMutation?.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {addMutation?.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="glass-card divide-y divide-white/[0.06] border border-white/10">
        {domainsQuery?.isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : domains.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No domains connected</h3>
            <p className="text-sm text-muted-foreground">
              Add a custom domain to give your app a professional URL
            </p>
          </div>
        ) : (
          domains.map((domain: any) => (
            <div key={domain.id} className="p-4 space-y-4 hover:bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{domain.hostname}</div>
                  {domain.is_verified ? (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider font-bold">
                      <AlertCircle className="w-3 h-3" />
                      Pending DNS
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => verifyMutation?.mutate({ domainId: domain.id })}
                    disabled={verifyMutation?.isLoading}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
                    title="Refresh DNS Status"
                  >
                    <RefreshCw className={cn("w-4 h-4", verifyMutation?.isLoading && "animate-spin")} />
                  </button>
                  <button
                    onClick={() => deleteMutation?.mutate({ domainId: domain.id })}
                    className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-white/5"
                    title="Remove Domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!domain.is_verified && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 text-xs space-y-2">
                  <div className="text-muted-foreground font-medium uppercase tracking-tighter">DNS Configuration Needed</div>
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="text-gray-500">Type</div>
                    <div className="text-gray-500">Name</div>
                    <div className="text-gray-500">Value</div>
                    <div className="font-mono">CNAME</div>
                    <div className="font-mono">@</div>
                    <div className="font-mono text-emerald-400">cname.sarge-ingress.io</div>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-amber-400/80">
                    <ExternalLink className="w-3 h-3" />
                    <span>Propagating DNS can take up to 48 hours.</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SSL Notice */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-emerald-300">Automatic SSL Certificates</div>
          <p className="text-emerald-300/60 mt-0.5">
            Sarge automatically provisions and renews Let's Encrypt certificates for all verified domains.
          </p>
        </div>
      </div>
    </div>
  )
}
