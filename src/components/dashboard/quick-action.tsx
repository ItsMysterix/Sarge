import React from "react"
import { cn } from "@/lib/utils"

export const QuickAction = React.memo(({ icon, label, description, onClick, primary }: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  primary?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl text-left transition-all group",
        "border border-white/[0.06] gpu-accelerate",
        primary 
          ? "bg-gradient-to-br from-violet-500/20 to-purple-600/10 hover:from-violet-500/30 hover:to-purple-600/20 border-violet-500/20" 
          : "bg-white/[0.02] hover:bg-white/[0.05]"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors",
        primary ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
      )}>
        {icon}
      </div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  )
})
