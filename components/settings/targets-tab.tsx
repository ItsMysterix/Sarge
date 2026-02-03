"use client"

import { Cloud, Globe2, Zap, Plug, Link as LinkIcon, Check } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const defaultProviders = [
  { id: "vercel", name: "Vercel", kind: "functions" as const, description: "Serverless deployments", badge: "Edge" },
  { id: "railway", name: "Railway", kind: "containers" as const, description: "Container hosting", badge: "Docker" },
  { id: "fly", name: "Fly.io", kind: "containers" as const, description: "Global edge containers", badge: "Edge" },
  { id: "netlify", name: "Netlify", kind: "static" as const, description: "Static sites & functions", badge: "JAMstack" },
  { id: "aws", name: "AWS", kind: "containers" as const, description: "Full cloud infrastructure", badge: "Enterprise" },
]

export function TargetsTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const providersQuery = t.providers?.list?.useQuery(
    { projectSlug: currentProject?.slug },
    { enabled: !!currentProject?.slug }
  )
  
  const toggleMutation = t.providers?.toggle?.useMutation({
    onSuccess: () => {
      providersQuery?.refetch()
    }
  })

  // Merge API data with defaults
  const providers = defaultProviders.map(p => {
    const apiProvider = providersQuery?.data?.find((ap: any) => ap.id === p.id)
    return {
      ...p,
      status: apiProvider?.status || "disconnected"
    }
  })

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "connected" ? "disconnected" : "connected"
    
    try {
      await toggleMutation?.mutateAsync({
        providerId: id,
        projectSlug: currentProject?.slug,
        status: newStatus
      })
      addToast({
        type: newStatus === "connected" ? "success" : "info",
        title: newStatus === "connected" ? "Connected" : "Disconnected",
        description: `Provider ${newStatus === "connected" ? "ready for deployment" : "disconnected"}`
      })
    } catch {
      addToast({ type: "error", title: "Failed", description: "Could not update provider" })
    }
  }

  const getIcon = (kind: "containers" | "functions" | "static") => {
    if (kind === "static") return <Globe2 className="w-5 h-5" />
    if (kind === "functions") return <Zap className="w-5 h-5" />
    return <Cloud className="w-5 h-5" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Cloud className="w-5 h-5 text-muted-foreground" />
          Deployment Targets
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect cloud providers to enable one-click deployments
        </p>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={cn(
              "glass-card p-5 flex flex-col gap-4 transition-all",
              provider.status === "connected" && "border-emerald-500/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  provider.status === "connected" 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-white/5 text-muted-foreground"
                )}>
                  {getIcon(provider.kind)}
                </div>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
              </div>
              
              {provider.status === "connected" && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                {provider.badge}
              </span>
            </div>

            <button
              onClick={() => handleToggle(provider.id, provider.status)}
              disabled={toggleMutation?.isLoading}
              className={cn(
                "w-full py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                provider.status === "connected"
                  ? "border-white/10 text-muted-foreground hover:border-white/20"
                  : "border-white/20 text-foreground hover:bg-white/5"
              )}
            >
              {provider.status === "connected" ? (
                <>
                  <Plug className="w-4 h-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
