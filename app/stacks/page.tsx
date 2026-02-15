"use client"
export const dynamic = "force-dynamic"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, Plus, Archive, Play, Pause, AlertCircle, CheckCircle2, 
  Cpu, Database, X, Loader2 
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export default function StacksPage() {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { addToast, ToastContainer } = useToast()
  const t = trpc as any
  const stacksQuery = t.stacks?.list?.useQuery?.()
  const updateMutation = t.stacks?.updateStatus?.useMutation?.()
  const createMutation = t.stacks?.create?.useMutation?.()

  const stacks = stacksQuery?.data || []

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showModal])

  const handleToggle = async (stack: any) => {
    const newStatus = stack.status === "running" ? "stopped" : "running"
    try {
      await updateMutation?.mutateAsync?.({ id: stack.id, status: newStatus })
      stacksQuery?.refetch?.()
      addToast({ type: "success", title: `Stack ${newStatus === "running" ? "Started" : "Stopped"}` })
    } catch (err) {
      addToast({ type: "error", title: "Failed to update stack" })
      console.error(err);
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      addToast({ type: "error", title: "Name required" })
      return
    }
    try {
      setCreating(true)
      await createMutation?.mutateAsync?.({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        services: [],
        environment: {},
      })
      stacksQuery?.refetch?.()
      setShowModal(false)
      setNewName("")
      setNewDesc("")
      addToast({ type: "success", title: "Stack created" })
    } catch (err) {
      addToast({ type: "error", title: "Failed to create stack" })
      console.error('Failed to create stack:', err)
    } finally {
      setCreating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case "stopped": return <Pause className="w-4 h-4 text-zinc-400" />
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    }
  }

  return (
    <AppShell>
      <ToastContainer />
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Stacks</h1>
            <p className="text-sm text-muted-foreground">Compose services into isolated environments</p>
          </div>
          {stacks.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Stack
            </button>
          )}
        </div>

        {/* Loading */}
        {stacksQuery?.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!stacksQuery?.isLoading && stacks.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No stacks yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create a stack to compose services like APIs, databases, and workers into a cohesive environment.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Stack
            </button>
          </div>
        )}

        {/* Stacks Grid */}
        {stacks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {stacks.map((stack: any) => (
              <div
                key={stack.id}
                className="glass-card p-5 hover:border-white/20 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{stack.name}</h3>
                      {getStatusIcon(stack.status)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {stack.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    Services ({stack.services?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stack.services?.slice(0, 3).map((s: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded bg-white/5 border border-white/10">
                        {s.name}
                      </span>
                    ))}
                    {stack.services?.length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-white/5 text-muted-foreground">
                        +{stack.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Resources */}
                {stack.resource_usage && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">CPU:</span>
                        <span>{stack.resource_usage.cpu}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">RAM:</span>
                        <span>{stack.resource_usage.memory}MB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(stack)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                      stack.status === "running"
                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    {stack.status === "running" ? (
                      <><Pause className="w-4 h-4" /> Stop</>
                    ) : (
                      <><Play className="w-4 h-4" /> Start</>
                    )}
                  </button>
                  <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-muted-foreground">
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-muted-foreground">
                  Updated {new Date(stack.updated_at).toLocaleDateString()}
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
              <h3 className="text-lg font-semibold">Create Stack</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Name</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Payments Stack"
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this stack include?"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
