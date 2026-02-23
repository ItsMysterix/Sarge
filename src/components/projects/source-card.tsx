import React from 'react'
import { cn } from '@/lib/utils'

export function SourceCard({ icon, title, desc, active, onClick }: { id: string, icon: any, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border transition-all flex items-center gap-4 text-left group relative",
        active 
          ? "bg-foreground border-foreground text-background shadow-lg" 
          : "bg-card border-border hover:border-foreground/20 hover:bg-muted/30"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg border transition-colors shrink-0",
        active ? "bg-background/10 border-background/20 text-background" : "bg-muted border-border text-muted-foreground"
      )}>
         {icon}
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest truncate">{title}</p>
        <p className={cn("text-[8px] font-medium opacity-70 truncate", active ? "text-background" : "text-muted-foreground")}>{desc}</p>
      </div>
    </button>
  )
}
