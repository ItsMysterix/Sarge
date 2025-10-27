"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
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
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary"
import { CLERK_ENABLED } from "@/lib/clerk-safe"

export default function LandingPage() {
  const [time, setTime] = useState("")
  const [activeFeature, setActiveFeature] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
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

  const signUpLink = CLERK_ENABLED ? "/sign-up" : "/"
  const signInLink = CLERK_ENABLED ? "/sign-in" : "/"

  return (
    <AnimationErrorBoundary fallbackType="user">
    <div className="min-h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 glass-card border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="text-2xl font-bold text-accent terminal-text">SARGE</div>
              <motion.div 
                className="w-2 h-2 bg-accent rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <div className="text-sm text-gray-400">v2.0</div>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {["Features", "Demo", "Pricing"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-accent transition-colors relative"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.a>
              ))}
              <motion.div 
                className="terminal-text text-accent text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {time}
              </motion.div>
            </div>

            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link href={signInLink}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="text-gray-300 hover:text-accent hover:bg-accent/10">
                    Sign In
                  </Button>
                </motion.div>
              </Link>
              <Link href={signUpLink}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-accent hover:bg-accent/90 text-black font-bold hover:glow-accent transition-all duration-200">
                    Get Started
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="inline-block ml-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center glass-card px-4 py-2 rounded-full mb-8 border border-accent/30"
            >
              <motion.div 
                className="w-2 h-2 bg-accent rounded-full mr-2"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <span className="text-sm text-accent terminal-text">SYSTEM ONLINE • AI READY</span>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              DEVOPS
              <br />
              <motion.span 
                className="text-accent inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                COMMAND CENTER
              </motion.span>
            </motion.h1>

            <motion.p 
              className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Next-generation infrastructure monitoring with AI-powered insights, real-time analytics, and automated
              deployment intelligence for modern DevOps teams.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 text-lg hover:glow-accent transition-all duration-200"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Launch Command Center
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-6 text-center hover:bg-white/10 transition-all duration-300 group cursor-pointer"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-8 h-8 text-accent mx-auto mb-3" />
                </motion.div>
                <motion.div 
                  className="text-2xl font-bold text-white mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-accent">AI-Powered</span> Infrastructure Intelligence
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced monitoring capabilities that learn from your infrastructure patterns and provide actionable
              insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Cards */}
            <div className="space-y-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ x: 10 }}
                  className={`glass-card p-6 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeFeature === i
                      ? `${feature.bgColor} ${feature.borderColor} glow-accent`
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="flex items-start space-x-4">
                    <motion.div 
                      className={`p-3 rounded-lg ${feature.bgColor} border ${feature.borderColor}`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                    <motion.div
                      animate={{ x: activeFeature === i ? [0, 5, 0] : 0 }}
                      transition={{ repeat: activeFeature === i ? Infinity : 0, duration: 1.5 }}
                    >
                      <ChevronRight
                        className={`w-5 h-5 transition-colors ${activeFeature === i ? feature.color : "text-gray-400"}`}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Demo Preview */}
            <motion.div 
              className="glass-card p-8 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    {[{ color: "error" }, { color: "warning" }, { color: "accent" }].map((dot, i) => (
                      <motion.div
                        key={i}
                        className={`w-3 h-3 bg-${dot.color} rounded-full`}
                        whileHover={{ scale: 1.3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      />
                    ))}
                  </div>
                  <span className="terminal-text text-sm text-gray-400">sarge-dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className="w-2 h-2 bg-accent rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span className="terminal-text text-xs text-gray-400">LIVE</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {[
                    { icon: Activity, label: "System Health", value: "98.7%", color: "success" },
                    { icon: Zap, label: "Response Time", value: "42ms", color: "warning" },
                    { icon: Rocket, label: "Active Deployments", value: "3", color: "accent" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center justify-between p-3 glass-card rounded cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <item.icon className={`w-4 h-4 text-${item.color}`} />
                        </motion.div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <motion.span 
                        className={`text-${item.color} font-bold`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
                      >
                        {item.value}
                      </motion.span>
                    </motion.div>
                  ))}

                  <motion.div 
                    className="p-4 glass-card rounded border-l-4 border-l-accent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start space-x-3">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Brain className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-medium text-white mb-1">AI Recommendation</div>
                        <div className="text-xs text-gray-400">
                          Consider scaling database instance - memory usage consistently above 80%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div 
            className="glass-card p-12 rounded-lg border border-accent/30 bg-accent/5"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Ready to <motion.span 
                className="text-accent inline-block"
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                Transform
              </motion.span> Your DevOps?
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-400 mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Join hundreds of teams already using Sarge to monitor, analyze, and optimize their infrastructure.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/sign-up">
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 text-lg hover:glow-accent transition-all duration-200"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </Button>
                </motion.div>
              </Link>
              <Link href="/sign-in">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="glass-card border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    Sign In
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="inline-block ml-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div 
              className="flex items-center justify-center space-x-6 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              {[
                "Free 14-day trial",
                "No credit card required",
                "Cancel anytime"
              ].map((text, i) => (
                <motion.div
                  key={i}
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 border-t border-white/10 py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3 mb-4 md:mb-0"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl font-bold text-accent terminal-text">SARGE</div>
              <motion.div 
                className="w-2 h-2 bg-accent rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <div className="text-sm text-gray-400">DevOps Command Center</div>
            </motion.div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              {["Privacy", "Terms", "Support"].map((item, i) => (
                <motion.a
                  key={item}
                  href="#"
                  className="hover:text-accent transition-colors relative"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.a>
              ))}
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-2 h-2 bg-success rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-success">All Systems Operational</span>
              </motion.div>
            </div>
          </div>

          <motion.div 
            className="border-t border-white/10 mt-8 pt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-gray-500 terminal-text">
              © 2024 Sarge DevOps Platform. Built with Next.js, Neon, and Clerk Auth.
            </p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
    </AnimationErrorBoundary>
  )
}
