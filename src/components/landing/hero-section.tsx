"use client"

import { Rocket, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeroSectionProps {
  handleLaunchClick: () => void
}

export function HeroSection({ handleLaunchClick }: HeroSectionProps) {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="hero-element inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          YOUR INFRASTRUCTURE, ONE COMMAND AWAY
        </div>

        <h1 className="hero-element text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          <span className="text-muted-foreground">Deploy, Monitor &</span><br />
          <span>Govern Everything</span>
        </h1>

        <p className="hero-element text-lg text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
          Sarge is the unified DevOps command center for teams who ship to multiple clouds.
          One-click deploys, full observability, governance and drift detection — all in one place.
        </p>

        <div className="hero-element flex items-center justify-center gap-4 mt-10">
          <Button onClick={handleLaunchClick} size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-semibold">
            <Rocket className="w-4 h-4 mr-2" />
            Start Deploying
          </Button>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm border-border hover:bg-card">
              See All Features
            </Button>
          </Link>
        </div>

        {/* Terminal Preview */}
        <div className="hero-element mt-16 max-w-2xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">sarge-cli</span>
            </div>
            <div className="p-5 font-mono text-xs text-left space-y-1.5">
              <div><span className="text-emerald-400">$</span> <span className="text-muted-foreground">sarge deploy --target vercel --env production</span></div>
              <div className="text-muted-foreground/60">→ Building from stack &apos;web-app-v3&apos;...</div>
              <div className="text-muted-foreground/60">→ Connected to Vercel (project: sarge-dashboard)</div>
              <div className="text-muted-foreground/60">→ Deploying 3 services, 2 databases, 1 CDN...</div>
              <div className="text-emerald-400">✓ Deployed in 24s — https://sarge.app</div>
              <div className="text-muted-foreground/60">→ Observability: metrics active, alerts configured</div>
              <div className="text-muted-foreground/60">→ Governance: audit logged, cost estimate $12.40/mo</div>
              <div><span className="text-emerald-400">$</span> <span className="text-foreground/30 animate-pulse">_</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
