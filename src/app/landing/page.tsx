"use client"
export const dynamic = 'force-dynamic'

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import {
  Rocket,
  Activity,
  GitBranch,
  Shield,
  Zap,
  Terminal,
  Globe,
  Layers,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Cloud,
  Lock,
  Eye,
  ChevronRight,
  Server,
  Key,
  Users,
  Cpu,
  GitCompare,
  Coins,
  Map,
  Brain,
  Plug,
  Settings,
  FileCode,
  Box,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/clerk-safe"

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [time, setTime] = useState("")

  const handleLaunchClick = () => {
    if (isLoaded) {
      router.push(user ? "/" : "/sign-up")
    }
  }

  // Clock
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
      }))
    }
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  // Hero entrance animations (GSAP — no ScrollTrigger)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -80, opacity: 0, duration: 0.8, ease: "power3.out",
      })
      gsap.from(".hero-element", {
        y: 40, opacity: 0, duration: 0.9, stagger: 0.12,
        ease: "power3.out", delay: 0.3,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  // Intersection Observer for scroll-reveal sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    const revealItems = containerRef.current?.querySelectorAll(".reveal-on-scroll")
    revealItems?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

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

  const stats = [
    { value: "7+", label: "Cloud Providers" },
    { value: "<30s", label: "Deploy Time" },
    { value: "100%", label: "IaC Coverage" },
    { value: "0", label: "Config Files Needed" },
  ]

  const providers = [
    { name: "Vercel", icon: Globe },
    { name: "Render", icon: Server },
    { name: "Railway", icon: Zap },
    { name: "AWS", icon: Cloud },
    { name: "GCP", icon: Cpu },
    { name: "Azure", icon: Globe },
    { name: "Cloudflare", icon: Shield },
  ]

  const workflow = [
    { step: "01", title: "Create Project", description: "Name your project and configure defaults. Sarge scaffolds the workspace instantly.", icon: FileCode },
    { step: "02", title: "Connect Providers", description: "Link your cloud accounts — OAuth or API key. Multi-provider from day one.", icon: Plug },
    { step: "03", title: "Define Stack", description: "Build your infrastructure stack visually or with code. Sarge tracks every resource.", icon: Layers },
    { step: "04", title: "Deploy & Monitor", description: "One-click deploy to any target. Observability and governance activate automatically.", icon: Rocket },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav ref={navRef} className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">SARGE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">v2.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#providers" className="hover:text-foreground transition-colors">Providers</a>
            <span className="font-mono text-xs tabular-nums">{time}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                Get Started <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-24 pb-20 md:pt-32 md:pb-28">
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

      {/* Stats */}
      <section ref={statsRef} className="py-16 border-y border-border">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="reveal-on-scroll glass-card rounded-xl p-6 text-center" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} id="features" className="py-24">
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

      {/* How It Works */}
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

      {/* Providers */}
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

      {/* What Sets Sarge Apart */}
      <section className="py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Why Teams <span className="text-muted-foreground">Choose Sarge</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="reveal-on-scroll glass-card rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold">Full Visibility</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See every deployment, every cost, every drift issue across all projects and providers. Audit trails are automatic — no manual logging required.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-card p-4 font-mono text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Deployments today</span><span>24</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Services healthy</span><span className="text-emerald-400">18/18</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Drift detected</span><span className="text-amber-400">2 configs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. monthly cost</span><span>$247.30</span></div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Security First</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Secrets never leave your environment. OAuth and API key auth for every provider. Role-based access, encrypted storage, and zero-trust by default.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Encrypted secrets at rest & in transit",
                  "OAuth + API key provider auth",
                  "Audit log for every action",
                  "Role-based access controls",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="glass-card rounded-2xl p-12">
            <h2 className="reveal-on-scroll text-3xl md:text-4xl font-bold tracking-tight">
              Ready to <span className="text-muted-foreground">Take Command?</span>
            </h2>
            <p className="reveal-on-scroll text-muted-foreground mt-4 max-w-md mx-auto" style={{ transitionDelay: '100ms' }}>
              Deploy your first project in under 2 minutes. No credit card required.
            </p>
            <div className="reveal-on-scroll flex items-center justify-center gap-4 mt-8" style={{ transitionDelay: '200ms' }}>
              <Link href="/sign-up">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-12 px-8 border-border">
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="reveal-on-scroll flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground" style={{ transitionDelay: '300ms' }}>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Free to start</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 7 providers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm">SARGE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">DevOps Command Center</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">Status</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sarge. Built with Next.js, deployed everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}
