"use client"
export const dynamic = "force-dynamic"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Cloud, ShieldCheck, Zap, Globe2, Link as LinkIcon, Plug, ExternalLink, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"

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
        <LoadingScreen title="Discovering Targets" subtitle="Fetching connected cloud accounts..." />
      </AppShell>
    )
  }

  return (
    <AppShell title="Deployment Targets">
      <ToastContainer />
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Global Infrastructure</h2>
            <p className="text-sm text-muted-foreground font-medium">Select and configure the cloud providers you want to deploy to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!providers || providers.length === 0) ? (
              <div className="col-span-full py-24 text-center border border-dashed border-border rounded-3xl bg-muted/20">
                 <Plug className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                 <h3 className="text-xl font-bold mb-2">No active targets</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed font-medium">Connect your cloud infrastructure to start orchestrating deployments and managing resources.</p>
                 <Button
                    onClick={() => router.push('/settings')}
                    className="px-8 py-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all text-[10px] font-bold uppercase tracking-widest shadow-xl h-11"
                 >
                    Provision Cloud Account
                 </Button>
              </div>
            ) : (
            providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProviderIcon kind={provider.kind} />
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-foreground">{provider.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{provider.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-widest border ${
                      provider.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {provider.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium flex-wrap">
                  <span className="px-2 py-1 rounded-md bg-muted border border-border flex items-center gap-1.5 font-mono">
                    {provider.badge}
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border">
                    <ShieldCheck className="w-3 h-3 opacity-70" />
                    OAuth/API
                  </span>
                  {provider.costHint && (
                    <span className="px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground/80">
                      {provider.costHint}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                  <button
                    onClick={() => handleToggle(provider.id, provider.status === "connected" ? "disconnected" : "connected")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                      provider.status === "connected"
                        ? "border-border text-foreground hover:bg-muted"
                        : "border-foreground text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {provider.status === "connected" ? (
                      <>
                        <Plug className="w-3.5 h-3.5" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5" />
                        Connect Target
                      </>
                    )}
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Open provider dashboard"
                    onClick={() => addToast({
                      type: "info",
                      title: "Provider dashboard",
                      description: `Open ${provider.name} dashboard in a new tab.`,
                    })}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {providers && providers.length > 0 && (
          <div className="mt-8 bg-muted/20 border border-border rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-foreground text-background p-2 rounded-lg">
                 <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-foreground">Ready to Deploy?</p>
                <p className="text-xs text-muted-foreground font-medium">Select a target above, then proceed to the launch configuration.</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/projects')}
              variant="outline"
              className="px-6 py-2 bg-background border-border hover:bg-muted text-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
            >
              Back to Projects <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        </div>
      </main>
    </AppShell>
  )
}

function ProviderIcon({ kind }: { kind: Provider["kind"] }) {
  if (kind === "static") return <Globe2 className="w-5 h-5 text-foreground" />
  if (kind === "functions") return <Zap className="w-5 h-5 text-foreground" />
  return <Cloud className="w-5 h-5 text-foreground" />
}
