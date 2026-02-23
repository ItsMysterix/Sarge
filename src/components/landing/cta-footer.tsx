"use client"

import { Rocket, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 border-t border-border">
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
  )
}

export * from './footer'
