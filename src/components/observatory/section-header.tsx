import React from "react"

export const SectionHeader = ({ title, icon: Icon, action }: { title: string; icon: any; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {title}
    </h3>
    {action}
  </div>
)
