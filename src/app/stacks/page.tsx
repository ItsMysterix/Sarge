"use client"
export const dynamic = "force-dynamic"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Layers, Plus, Archive, Play, Pause, AlertCircle, CheckCircle2, 
  Cpu, Database, X
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"

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
      case "running": return <CheckCircle2 className="w-4 h-4 text-foreground" />
      case "stopped": return <Pause className="w-4 h-4 text-muted-foreground" />
      case "error": return <AlertCircle className="w-4 h-4 text-muted-foreground" />
      default: return <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
    }
  }

  return (
    <AppShell title="Stacks">
      <ToastContainer />
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl w-full animate-fade-in">
        
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-semibold text-muted-foreground">Your Stacks</h2>
           {stacks.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors h-9 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Stack
            </button>
          )}
        </div>

        {/* Loading */}
        {stacksQuery?.isLoading && (
          <LoadingScreen title="Assembling Stacks" subtitle="Organizing your cloud resources..." />
        )}

        {/* Empty State */}
        {!stacksQuery?.isLoading && stacks.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No stacks yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create a stack to compose services like APIs, databases, and workers into a cohesive environment.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
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
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{stack.name}</h3>
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
                      <span key={i} className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground border border-border">
                        {s.name}
                      </span>
                    ))}
                    {stack.services?.length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                        +{stack.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Resources */}
                {stack.resource_usage && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
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
                        ? "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        : "border-foreground/20 text-foreground hover:bg-foreground/5"
                    )}
                  >
                    {stack.status === "running" ? (
                      <><Pause className="w-4 h-4" /> Stop</>
                    ) : (
                      <><Play className="w-4 h-4" /> Start</>
                    )}
                  </button>
                  <button className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  Updated {new Date(stack.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Create Stack</h3>
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
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-foreground/20 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this stack include?"
                  rows={3}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-foreground/20 resize-none text-foreground"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50 hover:bg-foreground/90"
              >
                {creating && <div className="w-4 h-4 mr-1 border-2 border-background/20 border-t-background rounded-full animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
