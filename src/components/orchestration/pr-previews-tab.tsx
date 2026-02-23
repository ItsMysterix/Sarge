"use client"

import { GitPullRequest, GitBranch, ExternalLink } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"

export const PRPreviewsTab = () => {
  const { currentProject } = useProject()
  const previewsQ = trpc.prPreviews.list.useQuery({ projectId: currentProject?.id || '', status: undefined }, { enabled: !!currentProject?.id })
  const previews = previewsQ.data || []
  const loading = previewsQ.isLoading

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GitPullRequest className="w-4 h-4" /> PR Preview Environments
        </h3>
        <p className="text-xs text-muted-foreground font-medium">Automatic preview deployments for pull requests</p>
      </div>

      {loading ? (
        <div className="py-20"><LoadingScreen title="Loading Previews" subtitle="Scanning PR environments..." /></div>
      ) : previews.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-xl bg-muted/20">
          <GitPullRequest className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-foreground mb-1">No PR previews active.</p>
          <p className="text-xs text-muted-foreground mb-4">Configure a GitHub webhook to automatically spin up preview environments for every pull request.</p>
          <code className="text-[10px] bg-muted/50 border border-border rounded-lg px-4 py-2 inline-block font-mono text-muted-foreground">
            POST /api/trpc/prPreviews.githubWebhook
          </code>
        </div>
      ) : (
        <div className="space-y-3">
          {previews.map((pr: any) => (
            <div key={pr.id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 group hover:border-foreground/20 transition-all">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border",
                pr.status === 'ready' ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                pr.status === 'building' ? "border-amber-500/20 bg-amber-500/5 text-amber-400" :
                pr.status === 'failed' ? "border-red-500/20 bg-red-500/5 text-red-400" :
                "border-border bg-muted text-muted-foreground"
              )}>
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold truncate">#{pr.pr_number} {pr.pr_title}</span>
                  <Badge variant="outline" className={cn("text-[9px] uppercase font-bold tracking-widest",
                    pr.status === 'ready' ? "text-emerald-400 border-emerald-500/20" :
                    pr.status === 'building' ? "text-amber-400 border-amber-500/20" :
                    pr.status === 'failed' ? "text-red-400 border-red-500/20" :
                    "text-muted-foreground"
                  )}>{pr.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{pr.pr_author}</span>
                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {pr.branch}</span>
                  <span className="font-mono">#{pr.commit_sha?.slice(0,7)}</span>
                </div>
              </div>
              {pr.preview_url && (
                <a href={pr.preview_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
