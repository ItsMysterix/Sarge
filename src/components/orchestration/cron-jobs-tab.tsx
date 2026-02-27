"use client"

import { Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export const CronJobsTab = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center ring-1 ring-inset ring-white/[0.01] shadow-2xl">
             <Clock className="w-7 h-7 text-muted-foreground/20" />
           </div>
           <div>
             <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">Temporal_Chronos_Registry</h3>
             <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
               Automated_Temporal_Execution // Recurring_Kernel_Logic
             </p>
           </div>
        </div>
        <Button className="h-14 px-8 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-4">
          <Plus className="w-5 h-5" /> Schedule_New_Execution
        </Button>
      </div>

      <div className="py-48 text-center border border-dashed border-white/5 rounded-[3rem] bg-[#050505] ring-1 ring-inset ring-white/[0.01] shadow-2xl relative overflow-hidden">
         <Clock className="w-20 h-20 text-muted-foreground/5 mx-auto mb-10" />
         <p className="text-[14px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-4">TEMPORAL_VOID_DETECTED</p>
         <p className="text-[10px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
           No scheduled temporal nodes are active in this orchestration protocol path. Defining recurring triggers increases fleet autonomy.
         </p>
         
         <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-16 px-10">
            <div className="flex items-center gap-8 p-8 bg-[#0a0a0a] border border-white/5 rounded-[2rem] shadow-2xl w-full max-w-md text-left group hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01]">
               <div className="bg-indigo-500/5 px-4 py-2 rounded-xl font-black font-mono text-[11px] tracking-widest text-indigo-400/60 uppercase border border-indigo-500/10">
                 0 0 * * *
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-foreground/80 uppercase tracking-tight truncate mb-2">Backup_Ledger_Task</p>
                  <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest truncate">POST /api/trpc/sys.backup</p>
               </div>
            </div>
            
            <div className="flex items-center gap-8 p-8 bg-[#0a0a0a] border border-white/5 rounded-[2rem] shadow-2xl w-full max-w-md text-left group hover:border-white/10 transition-all duration-700 opacity-20 filter grayscale ring-1 ring-inset ring-white/[0.01]">
               <div className="bg-white/5 px-4 py-2 rounded-xl font-black font-mono text-[11px] tracking-widest text-muted-foreground/40 uppercase border border-white/5">
                 */15 * * * *
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-foreground/40 uppercase tracking-tight truncate mb-2">Sync_Health_Probe</p>
                  <p className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-widest truncate">GET /api/health/pulse</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
