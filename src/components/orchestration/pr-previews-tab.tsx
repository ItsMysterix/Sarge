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

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#0a0a0a] border border-white/5 rounded-[2rem] animate-pulse ring-1 ring-inset ring-white/[0.01]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center ring-1 ring-inset ring-white/[0.01] shadow-2xl">
             <GitPullRequest className="w-7 h-7 text-muted-foreground/20" />
           </div>
           <div>
             <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Transient_Ephemeral_Manifests</h3>
             <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-amber-500/40" />
               Automated_Preview_Propagation // Pull_Request_Protocols
             </p>
           </div>
        </div>
      </div>

      {previews.length === 0 ? (
        <div className="py-48 text-center border border-dashed border-white/5 rounded-[3rem] bg-[#050505] ring-1 ring-inset ring-white/[0.01] shadow-2xl relative overflow-hidden">
          <GitPullRequest className="w-20 h-20 text-muted-foreground/5 mx-auto mb-10" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-4">REGISTRY_VOID_DETECTED</p>
          <p className="text-[10px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
            No transient nodes active. Configure an epistemic webhook to automatically provision environments for every pull request event.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <code className="text-[10px] font-black uppercase tracking-[0.3em] bg-white/[0.02] border border-white/5 rounded-2xl px-10 py-5 font-mono text-indigo-400/40 shadow-xl">
              POST_HOOK: /API/TRPC/PR_PREVIEWS.SYNC
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {previews.map((pr: any) => (
            <div key={pr.id} className="relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex items-center gap-10 group hover:border-white/10 transition-all duration-700 shadow-2xl overflow-hidden ring-1 ring-inset ring-white/[0.01]">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-1000 shadow-2xl",
                pr.status === 'ready' ? "border-emerald-500/10 bg-emerald-500/[0.02] text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all" :
                pr.status === 'building' ? "border-amber-500/10 bg-amber-500/[0.02] text-amber-400" :
                pr.status === 'failed' ? "border-red-500/10 bg-red-500/[0.02] text-red-400" :
                "border-white/5 bg-white/[0.01] text-muted-foreground/20"
              )}>
                <GitPullRequest className={cn("w-8 h-8 transition-all duration-1000", pr.status === 'building' && "animate-pulse")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-6 mb-4">
                  <span className="text-[15px] font-black text-foreground/80 tracking-tight truncate uppercase italic group-hover:text-foreground transition-colors duration-700">NODE_#{pr.pr_number} // {pr.pr_title}</span>
                  <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl border shadow-inner",
                    pr.status === 'ready' ? "text-emerald-400/40 border-emerald-500/10 bg-emerald-500/[0.02]" :
                    pr.status === 'building' ? "text-amber-400/40 border-amber-500/10 bg-amber-500/[0.02]" :
                    pr.status === 'failed' ? "text-red-400/40 border-red-500/10 bg-red-500/[0.02]" :
                    "text-muted-foreground/20 border-white/5 bg-white/[0.01]"
                  )}>{pr.status}</div>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">
                  <span className="text-foreground/40">{pr.pr_author}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                  <span className="flex items-center gap-3"><GitBranch className="w-4 h-4 text-indigo-400/40" /> {pr.branch?.toUpperCase()}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                  <span className="font-mono text-indigo-400/[0.15] tracking-[0.3em] font-black">HASH_#{pr.commit_sha?.toUpperCase().slice(0,8)}</span>
                </div>
              </div>
              {pr.preview_url ? (
                <a href={pr.preview_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-6 h-16 px-10 rounded-[1.5rem] border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 hover:text-foreground transition-all duration-700 shadow-xl group/access active:scale-95">
                  <ExternalLink className="w-5 h-5 group-hover/access:scale-110 transition-all duration-700" /> LAUNCH_ACCESS_KEY
                </a>
              ) : (
                <div className="h-16 px-10 rounded-[1.5rem] border border-white/5 bg-white/[0.01] text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/10 flex items-center justify-center opacity-40 italic">
                   AWAITING_UPLINK
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
