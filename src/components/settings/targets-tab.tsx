"use client"

import { Cloud, Globe2, Zap, Plug, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TargetsTabProps {
  providers: any[]
  onToggleProvider: (id: string, currentStatus: string) => void
}

export function TargetsTab({ providers, onToggleProvider }: TargetsTabProps) {
  const getIcon = (kind: "containers" | "functions" | "static" | string) => {
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
              "glass-card border border-white/10 p-5 flex flex-col gap-4 transition-all hover:border-white/20 group",
              provider.status === "connected" && "border-emerald-500/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                  provider.status === "connected" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-white/5 text-muted-foreground border-white/10 group-hover:bg-white/10"
                )}>
                  {getIcon(provider.kind)}
                </div>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
              </div>
              
              <div className={cn(
                "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-widest",
                provider.status === 'connected' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"
              )}>
                {provider.status}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground uppercase font-bold tracking-tighter">
                {provider.badge}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest opacity-70">
                {provider.costHint}
              </span>
            </div>

            <button
              onClick={() => onToggleProvider(provider.id, provider.status)}
              className={cn(
                "w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                provider.status === 'connected' 
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                  : "bg-white/10 text-foreground border border-white/20 hover:bg-white/20"
              )}
            >
              {provider.status === 'connected' ? (
                <span className="flex items-center justify-center gap-2">
                   <Plug className="w-3 h-3" /> Disconnect
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                   <LinkIcon className="w-3 h-3" /> Connect Account
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
