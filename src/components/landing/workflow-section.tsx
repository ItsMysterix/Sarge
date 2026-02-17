"use client"

import { FileCode, Plug, Layers, Rocket, ArrowRight } from "lucide-react"

const workflow = [
  { step: "01", title: "Create Project", description: "Name your project and configure defaults. Sarge scaffolds the workspace instantly.", icon: FileCode },
  { step: "02", title: "Connect Providers", description: "Link your cloud accounts — OAuth or API key. Multi-provider from day one.", icon: Plug },
  { step: "03", title: "Define Stack", description: "Build your infrastructure stack visually or with code. Sarge tracks every resource.", icon: Layers },
  { step: "04", title: "Deploy & Monitor", description: "One-click deploy to any target. Observability and governance activate automatically.", icon: Rocket },
]

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="py-24 border-t border-border workflow-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            From Zero to <span className="text-muted-foreground">Production in Minutes</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Four steps. Any cloud. Full governance from the start.
          </p>
        </div>

        <div className="space-y-6">
          {workflow.map((w, i) => (
            <div key={i} className="reveal-on-scroll flex items-start gap-6 glass-card rounded-xl p-6" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                <w.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{w.step}</span>
                  <h3 className="font-semibold">{w.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
              </div>
              {i < workflow.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-4 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
