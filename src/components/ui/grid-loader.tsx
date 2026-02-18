"use client"

import { cn } from "@/lib/utils"

interface GridLoaderProps {
  className?: string
  fullPage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function GridLoader({ className, fullPage = false, size = 'md' }: GridLoaderProps) {
  const squareClass = cn(
    "bg-foreground rounded-[2px] animate-[pulse_2s_infinite]",
    size === 'sm' ? "w-1.5 h-1.5" : size === 'lg' ? "w-4 h-4" : "w-2.5 h-2.5"
  )

  const content = (
    <div className={cn("inline-grid grid-cols-2 gap-1", className)}>
      <div className={cn(squareClass, "bg-foreground/80 [animation-delay:0ms]")} />
      <div className={cn(squareClass, "bg-foreground/30 [animation-delay:500ms]")} />
      <div className={cn(squareClass, "bg-foreground/30 [animation-delay:1500ms]")} />
      <div className={cn(squareClass, "bg-foreground/80 [animation-delay:1000ms]")} />
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
