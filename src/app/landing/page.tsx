"use client"
export const dynamic = 'force-dynamic'

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { ChevronRight, Eye, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/clerk-safe"

import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { WorkflowSection } from "@/components/landing/workflow-section"
import { ProvidersSection } from "@/components/landing/providers-section"
import { CTASection, Footer } from "@/components/landing/cta-footer"

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [time, setTime] = useState("")

  const handleLaunchClick = () => {
    if (isLoaded) router.push(user ? "/" : "/sign-up")
  }

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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, { y: -80, opacity: 0, duration: 0.8, ease: "power3.out" })
      gsap.from(".hero-element", { y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.3 })
    }, containerRef)
    return () => ctx.revert()
  }, [])

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
    containerRef.current?.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden">
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
            <Link href="/sign-in"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                Get Started <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection handleLaunchClick={handleLaunchClick} />
        <StatsSection />
        <FeaturesSection />
        <WorkflowSection />
        <ProvidersSection />

        <section className="py-24 border-t border-border">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="reveal-on-scroll glass-card rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold">Full Visibility</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See every deployment, every cost, every drift issue across all projects and providers. Audit trails are automatic.
              </p>
            </div>
            <div className="glass-card rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Security First</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Secrets never leave your environment. OAuth and API key auth for every provider. Role-based access.
              </p>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
