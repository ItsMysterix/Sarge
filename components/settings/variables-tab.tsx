"use client"

import { useState } from "react"
import { Key, Plus, Trash2, Eye, EyeOff, Copy, RotateCcw, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function VariablesTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  const secretsQuery = t.secrets?.list?.useQuery(
    { projectId: currentProject?.id, environmentId: "production" },
    { enabled: !!currentProject?.id }
  )
  
  const setMutation = t.secrets?.set?.useMutation({
    onSuccess: () => {
      secretsQuery?.refetch()
      setNewKey("")
      setNewValue("")
      setIsAdding(false)
      addToast({ type: "success", title: "Variable added", description: "Secret has been encrypted and saved" })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Error", description: err.message })
    }
  })
  
  const deleteMutation = t.secrets?.delete?.useMutation({
    onSuccess: () => {
      secretsQuery?.refetch()
      addToast({ type: "success", title: "Variable deleted" })
    }
  })

  const handleAdd = () => {
    if (!newKey || !newValue) return
    setMutation?.mutate({
      projectId: currentProject?.id,
      environmentId: "production",
      key: newKey,
      value: newValue
    })
  }

  const handleDelete = (key: string) => {
    if (!confirm(`Delete ${key}?`)) return
    deleteMutation?.mutate({
      projectId: currentProject?.id,
      environmentId: "production",
      key
    })
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast({ type: "info", title: "Copied", description: `${key} copied to clipboard` })
  }

  const secrets = secretsQuery?.data || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            Environment Variables
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage secrets and environment variables. All values are encrypted at rest.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Variable
        </button>
      </div>

      {/* Add New Variable Form */}
      {isAdding && (
        <div className="glass-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                placeholder="DATABASE_URL"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-mono focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Value</label>
              <input
                type="password"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-mono focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newKey || !newValue || setMutation?.isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-black rounded-lg disabled:opacity-50"
            >
              {setMutation?.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      <div className="glass-card divide-y divide-white/[0.06]">
        {secretsQuery?.isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : secrets.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No variables yet</h3>
            <p className="text-sm text-muted-foreground">
              Add environment variables to use in your deployments
            </p>
          </div>
        ) : (
          secrets.map((secret: any) => (
            <div key={secret.key} className="p-4 flex items-center gap-4 hover:bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium">{secret.key}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {showValues[secret.key] ? secret.value || "••••••••" : "••••••••"}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowValues(v => ({ ...v, [secret.key]: !v[secret.key] }))}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
                  title={showValues[secret.key] ? "Hide" : "Show"}
                >
                  {showValues[secret.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopy(secret.key)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
                  title="Copy key"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(secret.key)}
                  className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-white/5"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
          Variables are encrypted at rest and injected at runtime
        </p>
      </div>
    </div>
  )
}
