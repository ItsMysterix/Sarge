import React from "react"

export const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-muted/30">
    <Icon className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">{subtitle}</p>}
  </div>
)
