import React from "react"
import { cn } from "@/lib/utils"

export const ResourceLink = React.memo(({ icon, label, count, onClick }: { 
  icon: React.ReactNode
  label: string
  count: string
  onClick: () => void 
}) => {
  return (
    <button 
      onClick={onClick}
      className="w-full p-3 text-left rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex items-center gap-3 group gpu-accelerate"
    >
      <div className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center">
        {icon}
      </div>
      <span className="text-sm flex-1">{label}</span>
      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  )
})
