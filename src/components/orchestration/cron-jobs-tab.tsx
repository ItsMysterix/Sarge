"use client"

import { Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export const CronJobsTab = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Clock className="w-4 h-4" /> Scheduled Tasks
           </h3>
           <p className="text-xs text-muted-foreground font-medium">Manage serverless cron jobs and recurring background tasks.</p>
        </div>
        <Button className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-2" /> New Cron Job
        </Button>
      </div>

      <div className="py-24 text-center border border-dashed border-border rounded-xl bg-muted/20">
         <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
         <p className="text-sm font-bold text-foreground mb-1">No cron jobs configured yet.</p>
         <p className="text-xs text-muted-foreground mb-6">Schedule routine database cleanups, email digests, or webhook triggers.</p>
         <div className="flex items-center justify-center gap-4 text-left p-4 max-w-sm mx-auto bg-card border border-border rounded-lg shadow-sm">
            <div className="bg-muted px-2 py-1 rounded font-mono text-[10px] tracking-wider font-bold">0 0 * * *</div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold truncate">Daily Backup Trigger</p>
               <p className="text-[10px] text-muted-foreground truncate">POST /api/webhooks/backup</p>
            </div>
         </div>
      </div>
    </div>
  )
}
