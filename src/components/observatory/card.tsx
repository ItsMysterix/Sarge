import React from "react"
import { cn } from "@/lib/utils"

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "p-10 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01]", 
    className
  )}>
    {children}
  </div>
)
