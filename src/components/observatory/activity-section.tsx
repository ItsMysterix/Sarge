"use client"

import { RefreshCw, History, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { SectionHeader, EmptyState } from "./shared"

export const ActivitySection = ({ slug }: { slug: string }) => {
  const dashboardQuery = trpc.project.getDashboardSummary.useQuery(
    { slug },
    { enabled: !!slug, staleTime: 10000 }
  )
  const activity = dashboardQuery.data?.activity || []

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Event Stream"
        icon={History}
        action={
          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground" onClick={() => dashboardQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", dashboardQuery.isRefetching && "animate-spin")} /> Sync
          </Button>
        }
      />
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
        {activity.length === 0 ? (
          <EmptyState icon={Activity} title="No recent events recorded." />
        ) : (
          <div className="space-y-0 text-sm">
            {activity.map((item: any, i: number) => (
              <div key={item.id} className="relative pl-8 pb-8 last:pb-0 group">
                {i !== activity.length - 1 && (
                  <div className="absolute left-[5.5px] top-2.5 bottom-0 w-px bg-border group-hover:bg-border/80 transition-colors" />
                )}
                <div className={cn(
                  "absolute left-[1.5px] top-2 w-2 h-2 rounded-full ring-4 ring-card",
                  item.action.includes('SUCCESS') ? "bg-emerald-500" :
                  item.action.includes('FAILED') ? "bg-red-500" : "bg-indigo-500"
                )} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground leading-none">{item.action.replace(/_/g, ' ')}</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatDistanceToNow(new Date(item.created_at))} ago</span>
                  </div>
                  <div className="p-3 bg-muted/40 border border-border/50 rounded-lg text-xs text-muted-foreground font-mono leading-relaxed mt-1">
                    {JSON.stringify(item.details)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
