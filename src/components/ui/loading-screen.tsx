"use client"

import { GridLoader } from "./grid-loader"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
}

export function LoadingScreen({ title = "Initializing", subtitle = "Please wait…" }: LoadingScreenProps) {
  return (
    <div className="flex-1 min-h-[400px] w-full flex items-center justify-center p-6 animate-fade-in text-foreground">
      <div className="flex flex-col items-center">
        {/* The "Four Squares" Grid Loader */}
        <GridLoader className="mb-8 scale-125" />

        <div className="text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-2">{title}</h2>
          <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
