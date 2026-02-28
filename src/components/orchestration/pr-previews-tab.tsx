"use client"

import { GitPullRequest, GitBranch, ExternalLink, Search } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export const PRPreviewsTab = () => {
  const { currentProject } = useProject()
  const previewsQ = trpc.prPreviews.list.useQuery({ projectId: currentProject?.id || '', status: undefined }, { enabled: !!currentProject?.id })
  const previews = previewsQ.data || []
  const loading = previewsQ.isLoading

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg">
             <GitPullRequest className="w-6 h-6 text-white/20" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white">Preview Deployments</h3>
             <p className="text-xs text-white/20 mt-0.5">Automated environments for every pull request.</p>
           </div>
        </div>
      </div>

      {previews.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01] shadow-xl relative overflow-hidden flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
            <GitPullRequest className="w-10 h-10 text-white/5" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active previews</h3>
          <p className="text-xs text-white/20 max-w-sm mx-auto leading-relaxed mb-8">
            Once you open a pull request, an ephemeral environment will be automatically provisioned for testing.
          </p>
          <div className="flex items-center justify-center">
            <code className="text-[10px] font-bold uppercase tracking-widest bg-black border border-white/5 rounded-xl px-6 py-3 text-white/20 font-mono shadow-xl">
              Waiting for webhook activity...
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {previews.map((pr: any, idx: number) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={pr.id} 
                className="relative bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-white/10 transition-all shadow-xl overflow-hidden"
              >
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-500",
                  pr.status === 'ready' ? "border-emerald-500/10 bg-emerald-500/[0.02] text-emerald-400/60" :
                  pr.status === 'building' ? "border-amber-500/10 bg-amber-500/[0.02] text-amber-400/60" :
                  pr.status === 'failed' ? "border-red-500/10 bg-red-500/[0.02] text-red-500/40" :
                  "border-white/5 bg-white/[0.01] text-white/10"
                )}>
                  <GitPullRequest className={cn("w-6 h-6", pr.status === 'building' && "animate-pulse")} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors truncate">PR #{pr.pr_number}: {pr.pr_title}</span>
                    <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5",
                      pr.status === 'ready' ? "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" :
                      pr.status === 'building' ? "text-amber-400 border-amber-500/10 bg-amber-500/5" :
                      pr.status === 'failed' ? "text-red-400 border-red-500/10 bg-red-500/5" :
                      "text-white/20 border-white/5 bg-white/5"
                    )}>
                      {pr.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <span className="text-white/40">{pr.pr_author}</span>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5" /> 
                      {pr.branch}
                    </div>
                    <div className="font-mono text-white/10">
                      {pr.commit_sha?.slice(0, 7)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {pr.preview_url ? (
                    <Button 
                      asChild 
                      size="sm"
                      variant="outline"
                      className="h-10 px-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl"
                    >
                      <a href={pr.preview_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-2" /> View Preview
                      </a>
                    </Button>
                  ) : (
                    <div className="h-10 px-6 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest text-white/5 flex items-center justify-center italic">
                       Deploying...
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
