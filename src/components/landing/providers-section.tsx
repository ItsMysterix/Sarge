"use client"

import { Globe, Server, Zap, Cloud, Cpu, Shield } from "lucide-react"

const providers = [
  { name: "Vercel", icon: Globe },
  { name: "Render", icon: Server },
  { name: "Railway", icon: Zap },
  { name: "AWS", icon: Cloud },
  { name: "GCP", icon: Cpu },
  { name: "Azure", icon: Globe },
  { name: "Cloudflare", icon: Shield },
]

export function ProvidersSection() {
  return (
    <section id="providers" className="py-24 border-t border-border providers-section">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          One Dashboard. <span className="text-muted-foreground">Every Cloud.</span>
        </h2>
        <p className="text-muted-foreground mb-12 max-w-lg mx-auto">
          Connect any combination of providers. Sarge normalizes the interface so your team uses one workflow everywhere.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {providers.map((p, i) => (
            <div key={i} className="reveal-on-scroll glass-card rounded-xl px-6 py-4 flex items-center gap-3 min-w-[140px]" style={{ transitionDelay: `${i * 60}ms` }}>
              <p.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{p.name}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Custom provider support coming soon via plugin SDK
        </p>
      </div>
    </section>
  )
}
