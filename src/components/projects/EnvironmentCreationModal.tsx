"use client"

import { useState } from "react"
import { Plus, X, Layers, Globe, Cpu, Database } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface EnvironmentCreationModalProps {
  projectSlug: string
  onClose: () => void
  onCreated: (envId: string) => void
}

const PROVIDERS = [
  { id: 'local', name: 'Local Docker', icon: Cpu, type: 'development' },
  { id: 'aws', name: 'AWS (ECS/EKS)', icon: Globe, type: 'production' },
  { id: 'kubernetes', name: 'Kubernetes', icon: Layers, type: 'staging' },
  { id: 'vercel', name: 'Vercel', icon: Globe, type: 'production' },
  { id: 'railway', name: 'Railway', icon: Database, type: 'development' },
]

export function EnvironmentCreationModal({ projectSlug, onClose, onCreated }: EnvironmentCreationModalProps) {
  const { addToast } = useToast()
  const [name, setName] = useState("")
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].id)
  const [envType, setEnvType] = useState<"development" | "staging" | "production" | "preview">("development")

  const createEnv = trpc.environments.create.useMutation({
    onSuccess: (data) => {
      addToast({
        title: "Environment Created",
        description: `Successfully created ${data.name}.`,
        type: "success"
      })
      onCreated(data.id)
      onClose()
    },
    onError: (err) => {
      addToast({
        title: "Creation Failed",
        description: err.message,
        type: "error"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    createEnv.mutate({
      projectSlug,
      providerId: selectedProvider,
      name,
      type: envType,
      region: 'us-east-1',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Create Environment</h2>
            <p className="text-sm text-muted-foreground">Define a new deployment target for this project.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Environment Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Production Cluster, Local Dev" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="bg-muted/30 border-border focus:border-foreground/20"
              />
            </div>

            <div className="space-y-2">
              <Label>Environment Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["development", "staging", "production", "preview"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEnvType(type as any)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-lg border transition-all",
                      envType === type 
                        ? "bg-foreground text-background border-foreground shadow-sm" 
                        : "bg-muted/30 text-muted-foreground border-border hover:border-foreground/20"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Provider</Label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left group",
                      selectedProvider === provider.id
                        ? "bg-foreground/5 border-foreground/30 shadow-sm"
                        : "bg-muted/10 border-border hover:border-foreground/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        selectedProvider === provider.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:bg-muted/50"
                      )}>
                        <provider.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{provider.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase opacity-70">Infrastructure Layer</div>
                      </div>
                    </div>
                    {selectedProvider === provider.id && (
                      <div className="w-2 h-2 rounded-full bg-foreground shadow-[0_0_8px_rgba(var(--foreground),0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name || createEnv.isLoading}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wide text-xs h-10"
            >
              {createEnv.isLoading ? "Provisioning..." : "Provision Environment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
