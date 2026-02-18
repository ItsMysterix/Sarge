"use client"

import { LoadingScreen } from "@/components/ui/loading-screen"

export function AuthLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
       <LoadingScreen title="Initializing Command Center" subtitle="Authenticating secure access..." />
       <div className="absolute bottom-12 w-full text-center">
          <div className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.3em]">
            Secure authentication in progress...
          </div>
       </div>
    </div>
  )
}
