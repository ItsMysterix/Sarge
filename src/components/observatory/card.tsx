import React from "react"
import { cn } from "@/lib/utils"

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm", className)}>
    {children}
  </div>
)
