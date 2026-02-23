import React from "react"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Needs to be imported or duplicated. I will duplicate it for now or assume it is imported from the main components file.
// Wait, ServiceOption is exported from InfrastructureBlueprint.tsx, I should import it.
import { ServiceOption } from "../InfrastructureBlueprint"

export const ServiceCard = ({
  service, selected, onToggle, connected, isRecommended, onConnect
}: {
  service: ServiceOption, selected: boolean, onToggle: () => void, connected: boolean, isRecommended?: boolean, onConnect: () => void
}) => {
  const Icon = service.icon
  return (
    <motion.div
      layout
      onClick={onToggle}
      className={cn(
        "relative p-4 rounded-xl border transition-all cursor-pointer group flex items-center gap-4",
        selected
          ? "bg-foreground/5 border-foreground/30 shadow-md"
          : "bg-card border-border hover:border-foreground/20 hover:bg-muted/30"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0",
        selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:scale-105"
      )}>
         <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <h3 className="font-bold text-[11px] uppercase tracking-tight text-foreground truncate">
             {service.name}
           </h3>
           {isRecommended && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="AI Recommended" />}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight truncate opacity-70">
          {service.description}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
         {selected && (
            <div className={cn(
              "px-1.5 py-0.5 rounded-md flex items-center gap-1",
              connected ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            )}>
               {connected ? <CheckCircle2 className="w-2 h-2" /> : <AlertTriangle className="w-2 h-2" />}
               <span className="text-[8px] font-bold uppercase tracking-widest">{connected ? "OK" : "Link"}</span>
            </div>
         )}
         {!selected && isRecommended && (
            <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md text-[8px] font-bold uppercase">PREF</div>
         )}
      </div>
    </motion.div>
  )
}
