"use client"
export const dynamic = 'force-dynamic'

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Rocket,
  Activity,
  GitBranch,
  Shield,
  Zap,
  Terminal,
  Globe,
  Database,
  Layers,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Cloud,
  Lock,
  Eye,
  Play,
  ChevronRight,
  Server,
  Key,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/clerk-safe"

gsap.registerPlugin(ScrollTrigger)

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

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Nav slide down
      gsap.from(navRef.current, {
        y: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })

      // Hero stagger
      gsap.from(".hero-element", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.3,
      })

      // Stats count-up entrance
      gsap.from(".stat-card", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 85%",
        },
      })

      // Feature cards stagger
      gsap.from(".feature-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
      })

      // Workflow steps
      gsap.from(".workflow-step", {
        x: -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".workflow-section",
          start: "top 80%",
        },
      })

      // Provider logos
      gsap.from(".provider-logo", {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: ".providers-section",
          start: "top 85%",
        },
      })

      // CTA section
      gsap.from(".cta-element", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
        },
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  const features = [
    {
      icon: Rocket,
      title: "One-Click Deploy",
      description: "AI analyzes your repository, detects the stack, and generates an optimized deployment plan — then deploys it.",
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Live WebSocket feeds push deployment status, log entries, and metric updates to your dashboard without polling.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Encrypted sessions, row-level security, RBAC policies, and a full audit log for every mutation.",
    },
    {
      icon: Layers,
      title: "Environment Management",
      description: "Create, clone, and manage isolated environments per project — development, staging, production, preview.",
    },
    {
      icon: BarChart3,
      title: "Observability Stack",
      description: "Prometheus metrics, Grafana dashboards, and Alertmanager routing — all pre-configured and integrated.",
    },
    {
      icon: Cloud,
      title: "Multi-Cloud",
      description: "Connect AWS, GCP, Azure, Kubernetes, Vercel, and Render from a single unified control plane.",
    },
  ]

  const stats = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<50ms", label: "Response Time" },
    { value: "6", label: "Cloud Providers" },
    { value: "E2E", label: "Type Safety" },
  ]

  const providers = [
    { name: "AWS", icon: Cloud },
    { name: "GCP", icon: Server },
    { name: "Azure", icon: Database },
    { name: "Kubernetes", icon: Layers },
    { name: "Vercel", icon: Globe },
    { name: "Render", icon: Zap },
  ]

  const workflow = [
    {
      step: "01",
      title: "Connect Repository",
      description: "Link your GitHub repository to Sarge with OAuth. We detect your framework and branch.",
      icon: GitBranch,
    },
    {
      step: "02",
      title: "AI Analyzes Your Stack",
      description: "Our AI engine scans your codebase, identifies dependencies, and generates an optimized deployment plan.",
      icon: Terminal,
    },
    {
      step: "03",
      title: "Review & Deploy",
      description: "Review the AI-generated plan, customize if needed, and deploy to your infrastructure with one click.",
      icon: Rocket,
    },
    {
      step: "04",
      title: "Monitor & Scale",
      description: "Real-time metrics, logs, and alerts keep you in control. Scale up or roll back instantly.",
      icon: Activity,
    },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ═══ Navigation ═══ */}
      <nav ref={navRef} className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">SARGE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{time}</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Providers"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-medium">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section ref={heroRef} className="relative pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Status badge */}
          <div className="hero-element inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>

          <h1 className="hero-element text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your infrastructure,
            <br />
            <span className="text-muted-foreground">one command center.</span>
          </h1>

          <p className="hero-element text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy, monitor, and manage services across cloud providers without switching between vendor consoles. Real-time metrics, AI-powered deployments, and end-to-end type safety.
          </p>

          <div className="hero-element flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={handleLaunchClick}
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 font-medium px-8 h-12 text-base"
            >
              <Play className="w-4 h-4 mr-2" />
              Launch Dashboard
            </Button>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 text-base border-border hover:bg-card">
                Explore Features
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Terminal preview */}
          <div className="hero-element max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/20">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">sarge — deployment pipeline</span>
              </div>
              {/* Content */}
              <div className="p-5 font-mono text-sm text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <span className="text-foreground">sarge deploy --prod</span>
                </div>
                <div className="text-muted-foreground text-xs space-y-1.5 pl-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span>Repository connected — ItsMysterix/Sarge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span>AI analysis complete — Next.js 14, TypeScript, tRPC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span>Build succeeded in 1m 23s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span>Deployed to production — 3 regions</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-500 font-medium">✓ Live at</span>
                    <span className="text-foreground underline underline-offset-2 decoration-border">sarge.app</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section ref={statsRef} className="py-16 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card text-center">
                <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section ref={featuresRef} id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to ship.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From deployment orchestration to cost intelligence — Sarge covers every operational domain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="feature-card group p-6 rounded-xl border border-border bg-card hover:border-zinc-500/50 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-border flex items-center justify-center mb-4 group-hover:bg-white/[0.08] transition-colors">
                  <feature.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="py-24 border-t border-border workflow-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Deploy in four steps.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From repository to production in minutes, with AI doing the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {workflow.map((item, i) => (
              <div key={i} className="workflow-step flex gap-5 p-6 rounded-xl border border-border bg-card">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-border flex items-center justify-center font-mono text-sm font-bold text-muted-foreground">
                    {item.step}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Providers ═══ */}
      <section id="providers" className="py-24 border-t border-border providers-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              One interface, every provider.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect credentials once. Manage infrastructure everywhere.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {providers.map((provider, i) => (
              <div
                key={i}
                className="provider-logo flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-card hover:border-zinc-500/50 transition-all duration-200 min-w-[160px]"
              >
                <provider.icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm">{provider.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Security ═══ */}
      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Built for teams that
                <br />
                care about security.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every layer is hardened — from encrypted sessions to row-level database policies. Sarge is built with security-first architecture.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: "Encrypted JWTs with Auth.js session management" },
                  { icon: Shield, text: "Row-level security on all user-facing tables" },
                  { icon: Key, text: "RBAC policies per project and environment" },
                  { icon: Eye, text: "Complete audit log for every mutation" },
                  { icon: Users, text: "Multi-tenant isolation at application and database layers" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed pt-1.5">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture diagram */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-xs text-muted-foreground font-mono mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                architecture overview
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg border border-border bg-background">
                  <div className="text-foreground font-medium mb-1">Frontend — Next.js 14</div>
                  <div className="text-muted-foreground">React 19 • Auth.js • App Router • Tailwind</div>
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <div className="h-6 border-l border-border"></div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background text-center text-muted-foreground">
                  WebSocket — tRPC subscriptions
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <div className="h-6 border-l border-border"></div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background">
                  <div className="text-foreground font-medium mb-1">Backend — Node.js</div>
                  <div className="text-muted-foreground">tRPC Server • Event Emitter • Neon Postgres</div>
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <div className="h-6 border-l border-border"></div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background">
                  <div className="text-foreground font-medium mb-1">Observability</div>
                  <div className="text-muted-foreground">Prometheus → Grafana → Alertmanager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="cta-element text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to simplify your DevOps?
          </h2>
          <p className="cta-element text-lg text-muted-foreground mb-8">
            Join engineering teams already using Sarge to ship faster and sleep better.
          </p>

          <div className="cta-element flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/sign-up">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-medium px-8 h-12 text-base">
                <Rocket className="w-4 h-4 mr-2" />
                Start Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="h-12 text-base border-border hover:bg-card">
                Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="cta-element flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {["Free to start", "No credit card", "Cancel anytime"].map((text, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">SARGE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">DevOps Command Center</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">
                {item}
              </a>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500">Operational</span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Sarge. Built with Next.js, Neon, and tRPC.
          </p>
        </div>
      </footer>
    </div>
  )
}
