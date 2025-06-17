"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Brain,
  Shield,
  Zap,
  Rocket,
  Activity,
  ChevronRight,
  Play,
  CheckCircle,
  ArrowRight,
  Github,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [time, setTime] = useState("")
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Machine learning algorithms analyze your infrastructure patterns and predict issues before they occur.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/30",
    },
    {
      icon: Zap,
      title: "Real-Time Monitoring",
      description: "Live WebSocket connections provide instant updates on deployments, logs, and system metrics.",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Multi-factor authentication, SSO integration, and SOC 2 compliance for enterprise environments.",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
    {
      icon: Activity,
      title: "Performance Analytics",
      description: "Deep insights into application performance with automated recommendations for optimization.",
      color: "text-error",
      bgColor: "bg-error/10",
      borderColor: "border-error/30",
    },
  ]

  const stats = [
    { label: "Uptime", value: "99.9%", icon: Activity },
    { label: "Response Time", value: "<50ms", icon: Zap },
    { label: "Deployments", value: "10K+", icon: Rocket },
    { label: "Users", value: "500+", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-accent terminal-text">SARGE</div>
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <div className="text-sm text-gray-400">v2.0</div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-accent transition-colors">
                Features
              </a>
              <a href="#demo" className="text-gray-300 hover:text-accent transition-colors">
                Demo
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-accent transition-colors">
                Pricing
              </a>
              <div className="terminal-text text-accent text-sm">{time}</div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-300 hover:text-accent hover:bg-accent/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-accent hover:bg-accent/90 text-black font-bold hover:glow-accent transition-all duration-200">
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center glass-card px-4 py-2 rounded-full mb-8 border border-accent/30">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-accent terminal-text">SYSTEM ONLINE • AI READY</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent">
              DEVOPS
              <br />
              <span className="text-accent">COMMAND CENTER</span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Next-generation infrastructure monitoring with AI-powered insights, real-time analytics, and automated
              deployment intelligence for modern DevOps teams.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 text-lg hover:glow-accent transition-all duration-200"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Launch Command Center
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="glass-card border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-6 text-center hover:bg-white/10 transition-all duration-300 group">
                <stat.icon className="w-8 h-8 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-accent">AI-Powered</span> Infrastructure Intelligence
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced monitoring capabilities that learn from your infrastructure patterns and provide actionable
              insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Cards */}
            <div className="space-y-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`glass-card p-6 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeFeature === i
                      ? `${feature.bgColor} ${feature.borderColor} glow-accent`
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor} border ${feature.borderColor}`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-colors ${activeFeature === i ? feature.color : "text-gray-400"}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Preview */}
            <div className="glass-card p-8 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <div className="w-3 h-3 bg-warning rounded-full"></div>
                    <div className="w-3 h-3 bg-accent rounded-full"></div>
                  </div>
                  <span className="terminal-text text-sm text-gray-400">sarge-dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="terminal-text text-xs text-gray-400">LIVE</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass-card rounded">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-4 h-4 text-success" />
                    <span className="text-sm">System Health</span>
                  </div>
                  <span className="text-success font-bold">98.7%</span>
                </div>

                <div className="flex items-center justify-between p-3 glass-card rounded">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-sm">Response Time</span>
                  </div>
                  <span className="text-warning font-bold">42ms</span>
                </div>

                <div className="flex items-center justify-between p-3 glass-card rounded">
                  <div className="flex items-center space-x-3">
                    <Rocket className="w-4 h-4 text-accent" />
                    <span className="text-sm">Active Deployments</span>
                  </div>
                  <span className="text-accent font-bold">3</span>
                </div>

                <div className="p-4 glass-card rounded border-l-4 border-l-accent">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-white mb-1">AI Recommendation</div>
                      <div className="text-xs text-gray-400">
                        Consider scaling database instance - memory usage consistently above 80%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-card p-12 rounded-lg border border-accent/30 bg-accent/5">
            <h2 className="text-4xl font-bold mb-4">
              Ready to <span className="text-accent">Transform</span> Your DevOps?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join hundreds of teams already using Sarge to monitor, analyze, and optimize their infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 text-lg hover:glow-accent transition-all duration-200"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-card border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="text-2xl font-bold text-accent terminal-text">SARGE</div>
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <div className="text-sm text-gray-400">DevOps Command Center</div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-accent transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Support
              </a>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-success">All Systems Operational</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-xs text-gray-500 terminal-text">
              © 2024 Sarge DevOps Platform. Built with Next.js, Neon, and Clerk Auth.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
