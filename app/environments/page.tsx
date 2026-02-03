"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, Plus, GitBranch, Globe, Trash2, MoreVertical, 
  CheckCircle2, Clock, Loader2, X
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function EnvironmentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"dev" | "staging" | "prod">("dev")
  
  const t = trpc as any
  const envsQuery = t.environments?.list?.useQuery?.()
  const createMutation = t.environments?.create?.useMutation?.()
  
  // Mock data if no API
  const environments = envsQuery?.data || [
    { id: "1", name: "Development", type: "dev", status: "active", branch: "main", last_deploy: new Date().toISOString() },
    { id: "2", name: "Staging", type: "staging", status: "active", branch: "staging", last_deploy: new Date(Date.now() - 86400000).toISOString() },
    { id: "3", name: "Production", type: "prod", status: "active", branch: "main", last_deploy: new Date(Date.now() - 172800000).toISOString() },
  ]

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await createMutation?.mutateAsync?.({ name: newName.trim(), type: newType })
      envsQuery?.refetch?.()
      setShowModal(false)
      setNewName("")
    } catch {}
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "prod": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "staging": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Action Bar */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Environment
          </button>
        </div>

        {/* Environments Grid */}
        {envsQuery?.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {environments.map((env: any) => (
              <div
                key={env.id}
                className="glass-card p-5 hover:border-white/20 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{env.name}</h3>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide",
                        getTypeColor(env.type)
                      )}>{env.type}</span>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                    <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">{env.branch}</code>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{env.name.toLowerCase()}.example.com</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      env.status === "active" ? "bg-emerald-500" : "bg-zinc-500"
                    )} />
                    <span className="text-xs text-muted-foreground capitalize">{env.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(env.last_deploy)) + ' ago'
                      } catch {
                        return 'Unknown'
                      }
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Environment</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. QA, Feature Branch"
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Type</label>
                <div className="flex gap-2">
                  {(["dev", "staging", "prod"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm border transition-all",
                        newType === type 
                          ? getTypeColor(type)
                          : "border-white/[0.06] text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
