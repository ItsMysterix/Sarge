"use client"
export const dynamic = "force-dynamic"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Cloud, ShieldCheck, Zap, Rocket, Globe2, Link as LinkIcon, Plug } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { GridLoader } from "@/components/ui/grid-loader"

type Provider = {
  id: string
  name: string
  kind: "containers" | "functions" | "static"
  badge: string
  status: "disconnected" | "connected"
  description: string
  costHint?: string
}

export default function TargetsPage() {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  const { currentProject } = useProject()
  const t = trpc as any
  const providersQuery = t.providers.list.useQuery({ projectSlug: currentProject?.slug })
  const toggleMutation = t.providers.toggle.useMutation()

  const providers: Provider[] = useMemo(() => {
    if (providersQuery.data) return providersQuery.data
    return []
  }, [providersQuery.data])

  const handleToggle = async (id: string, status: Provider["status"]) => {
    try {
      await toggleMutation.mutateAsync({ providerId: id, projectSlug: currentProject?.slug, status })
      await providersQuery.refetch()
      addToast({
        type: status === "connected" ? "success" : "warning",
        title: status === "connected" ? "Connected" : "Disconnected",
        description: status === "connected" ? "Target ready for Launch." : "Target disconnected for this workspace.",
      })
    } catch (error) {
      addToast({ type: "error", title: "Action failed", description: error instanceof Error ? error.message : "Could not update provider" })
    }
  }

  if (providersQuery.isLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <GridLoader />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Deployment Targets">
      <ToastContainer />
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Global infrastructure</h2>
            <p className="text-sm text-muted-foreground">Select and configure the cloud providers you want to deploy to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!providers || providers.length === 0) ? (
              <div className="col-span-full py-24 text-center border border-dashed border-border rounded-3xl bg-muted/20">
                 <Plug className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                 <h3 className="text-xl font-bold mb-2">No active targets</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">Connect your cloud infrastructure to start orchestrating deployments and managing resources.</p>
                 <button
                    onClick={() => router.push('/settings')}
                    className="px-8 py-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all text-xs font-bold uppercase tracking-widest shadow-xl"
                 >
                    Provision Cloud Account
                 </button>
              </div>
            ) : (
            providers.map((provider) => (
              <div
                key={provider.id}
                className="glass-card border border-white/10 rounded-lg p-4 sm:p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProviderIcon kind={provider.kind} />
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">{provider.name}</h3>
                      <p className="text-xs text-gray-400">{provider.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded uppercase tracking-wide border ${
                      provider.status === "connected"
                        ? "bg-accent/20 text-accent border-accent/30"
                        : "bg-white/5 text-gray-300 border-white/10"
                    }`}
                  >
                    {provider.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{provider.badge}</span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <ShieldCheck className="w-3 h-3 text-accent" />
                    OAuth/API key
                  </span>
                  {provider.costHint && (
                    <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300">
                      {provider.costHint}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => handleToggle(provider.id, provider.status === "connected" ? "disconnected" : "connected")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 ${
                      provider.status === "connected"
                        ? "border-white/20 text-gray-200 hover:border-white/40"
                        : "border-accent/30 text-accent hover:bg-accent/20"
                    }`}
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
                  <button
                    className="px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:border-accent/30 transition-all duration-300 flex items-center gap-2"
                    title="Open provider dashboard"
                    onClick={() => addToast({
                      type: "info",
                      title: "Provider dashboard",
                      description: `Open ${provider.name} dashboard in a new tab.`,
                    })}
                  >
                    <ExternalLinkIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {providers && providers.length > 0 && (
          <div className="mt-6 glass-card border border-white/10 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Rocket className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-gray-300">Next step</p>
                <p className="text-xs text-gray-400">Pick a target above, then go to Launch to deploy.</p>
              </div>
            </div>
            <a
              href="/projects"
              className="px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center"
            >
              Go to Projects
            </a>
          </div>
        )}
        </div>
      </main>
    </AppShell>
  )
}

function ProviderIcon({ kind }: { kind: Provider["kind"] }) {
  if (kind === "static") return <Globe2 className="w-5 h-5 text-accent" />
  if (kind === "functions") return <Zap className="w-5 h-5 text-accent" />
  return <Cloud className="w-5 h-5 text-accent" />
}

function ExternalLinkIcon() {
  return <span className="terminal-text text-xs">↗</span>
}
