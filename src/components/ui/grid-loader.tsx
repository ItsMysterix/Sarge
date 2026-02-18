"use client"

import { cn } from "@/lib/utils"

export function GridLoader({ className, fullPage = false }: { className?: string; fullPage?: boolean }) {
  const content = (
    <div className={cn("inline-grid grid-cols-2 gap-1.5", className)}>
      <div className="w-2.5 h-2.5 bg-foreground/80 rounded-[2px] animate-[pulse_2s_infinite] [animation-delay:0ms]" />
      <div className="w-2.5 h-2.5 bg-foreground/30 rounded-[2px] animate-[pulse_2s_infinite] [animation-delay:500ms]" />
      <div className="w-2.5 h-2.5 bg-foreground/30 rounded-[2px] animate-[pulse_2s_infinite] [animation-delay:1500ms]" />
      <div className="w-2.5 h-2.5 bg-foreground/80 rounded-[2px] animate-[pulse_2s_infinite] [animation-delay:1000ms]" />
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex-1 min-h-[400px] w-full flex items-center justify-center animate-fade-in">
        {content}
      </div>
    )
  }

  return content
}
