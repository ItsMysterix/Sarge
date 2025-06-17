"use client"

import { SignIn } from "@clerk/nextjs"
import { Brain, Shield, Zap } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-accent terminal-text">SARGE</div>
            <div className="ml-3 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Command Center</h1>
          <p className="text-gray-400">Secure authentication required</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <Brain className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-xs text-gray-400">AI Insights</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="text-xs text-gray-400">Real-time</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Shield className="w-6 h-6 text-success mx-auto mb-2" />
            <div className="text-xs text-gray-400">Secure</div>
          </div>
        </div>

        {/* Clerk Sign In Component - Simplified */}
        <div className="glass-card p-6 rounded-lg border border-white/10">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "glass-card border border-white/10 text-white hover:bg-white/10 transition-colors",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400",
                formFieldLabel: "text-gray-300 font-medium",
                formFieldInput: "glass-card border border-white/10 text-white bg-transparent focus:border-accent/50",
                formButtonPrimary: "bg-accent hover:bg-accent/90 text-black font-bold",
                footerActionLink: "text-accent hover:text-accent/80",
                footerActionText: "text-gray-400",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            redirectUrl="/"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-xs text-gray-500 terminal-text">SARGE v2.0 • Secure DevOps Command Center</div>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-success">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
