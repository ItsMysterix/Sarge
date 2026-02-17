"use client"

import { Rocket, Layers, Settings, Activity, Shield, Brain, Plug, Key, GitCompare } from "lucide-react"

const features = [
  {
    icon: Rocket,
    title: "One-Click Deploy",
    description: "Deploy to any provider — Vercel, Render, Railway, AWS — with a single click. No config files needed.",
  },
  {
    icon: Layers,
    title: "Infrastructure Stacks",
    description: "Define, version, and manage your full infrastructure as code. Create stacks from templates or from scratch.",
  },
  {
    icon: Settings,
    title: "Orchestration Hub",
    description: "Manage environments, CI/CD pipelines, and secrets across all your projects from one unified console.",
  },
  {
    icon: Activity,
    title: "Observability Suite",
    description: "Real-time metrics, structured logs, and traffic maps. Monitor every service with live dashboards.",
  },
  {
    icon: Shield,
    title: "Governance & Compliance",
    description: "Audit trails, cost tracking, and drift detection. Stay compliant without slowing down deployments.",
  },
  {
    icon: Brain,
    title: "Explain — Stack Intelligence",
    description: "AI-free stack summaries from local data. See topology, health, errors, costs, and recent changes instantly.",
  },
  {
    icon: Plug,
    title: "Multi-Provider Targets",
    description: "Connect and manage Vercel, Render, Railway, AWS, GCP, Azure, and Cloudflare from a single pane of glass.",
  },
  {
    icon: Key,
    title: "Secrets Management",
    description: "Securely store, rotate, and inject environment variables and secrets across all environments.",
  },
  {
    icon: GitCompare,
    title: "Drift Detection",
    description: "Automatically compare live infrastructure state against your declared configuration. Fix drift in seconds.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything You Need to <span className="text-muted-foreground">Ship & Govern</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            From deploy to drift detection — Sarge covers the full DevOps lifecycle across every cloud provider.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="reveal-on-scroll glass-card rounded-xl p-6 group" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center mb-4 group-hover:border-white/20 transition-colors">
                <f.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
