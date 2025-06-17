"use client"

import { SignUp } from "@clerk/nextjs"
import { Brain, Shield, Zap } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-accent terminal-text">SARGE</div>
            <div className="ml-3 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Join Command Center</h1>
          <p className="text-gray-400">Create your secure access credentials</p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center hover:bg-white/10 transition-colors">
            <Brain className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-xs text-gray-400">AI-Powered</div>
            <div className="text-xs text-gray-500 mt-1">Smart Insights</div>
          </div>
          <div className="glass-card p-4 text-center hover:bg-white/10 transition-colors">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="text-xs text-gray-400">Real-time</div>
            <div className="text-xs text-gray-500 mt-1">Live Updates</div>
          </div>
          <div className="glass-card p-4 text-center hover:bg-white/10 transition-colors">
            <Shield className="w-6 h-6 text-success mx-auto mb-2" />
            <div className="text-xs text-gray-400">Enterprise</div>
            <div className="text-xs text-gray-500 mt-1">Security</div>
          </div>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="glass-card p-6 rounded-lg border border-white/10">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "glass-card border border-white/10 text-white hover:bg-white/10 transition-all duration-200 hover:border-accent/30",
                socialButtonsBlockButtonText: "text-white font-medium",
                socialButtonsBlockButtonArrow: "text-accent",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400 terminal-text",
                formFieldLabel: "text-gray-300 font-medium",
                formFieldInput:
                  "glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 focus:ring-accent/20 placeholder:text-gray-500",
                footerActionLink: "text-accent hover:text-accent/80 transition-colors",
                identityPreviewText: "text-gray-300",
                identityPreviewEditButton: "text-accent hover:text-accent/80",
                formButtonPrimary:
                  "bg-accent hover:bg-accent/90 text-black font-bold transition-all duration-200 hover:glow-accent",
                footerActionText: "text-gray-400",
                alternativeMethodsBlockButton:
                  "glass-card border border-white/10 text-white hover:bg-white/10 transition-colors",
                alternativeMethodsBlockButtonText: "text-white",
                otpCodeFieldInput:
                  "glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 text-center terminal-text",
                formResendCodeLink: "text-accent hover:text-accent/80",
                formFieldSuccessText: "text-success",
                formFieldErrorText: "text-error",
                formFieldWarningText: "text-warning",
                formFieldHintText: "text-gray-500 text-xs",
                formFieldAction: "text-accent hover:text-accent/80",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: true,
              },
            }}
            redirectUrl="/"
            signInUrl="/sign-in"
          />
        </div>

        {/* Security Notice */}
        <div className="glass-card p-4 mt-6 border-l-4 border-l-accent">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white mb-1">Enterprise Security</div>
              <div className="text-xs text-gray-400">
                Your data is encrypted end-to-end and stored securely. We support SSO, 2FA, and comply with SOC 2
                standards.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-xs text-gray-500 terminal-text">SARGE v2.0 • Secure DevOps Command Center</div>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-success">REGISTRATION ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
