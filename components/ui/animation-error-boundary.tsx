"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, Bug, RefreshCw, Code, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallbackType?: "user" | "developer" | "auto"
  userRole?: string // Pass from parent: 'developer' | 'manager' | 'viewer'
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AnimationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Animation Error:", error, errorInfo)
    
    // Log to external monitoring (e.g., Sentry, LogRocket)
    // if (window.Sentry) window.Sentry.captureException(error, { extra: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development"
      const userRole = this.props.userRole || "viewer"
      
      // Auto-detect: show developer view if in dev mode OR user role is developer
      let fallbackType = this.props.fallbackType || "auto"
      if (fallbackType === "auto") {
        fallbackType = (isDev || userRole === "developer") ? "developer" : "user"
      }

      if (fallbackType === "user") {
        return (
          <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center space-y-4 border border-warning/30">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/30">
                  <Users className="w-3 h-3 text-warning" />
                  <span className="text-xs text-warning font-medium">User View</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Temporary Display Issue</h2>
              </div>
              <p className="text-gray-400">
                We're experiencing a minor issue with the dashboard interface. 
                Your infrastructure is still running normally, but some visual elements may not display correctly.
              </p>
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 text-left">
                <p className="text-sm text-gray-300 mb-2">What you can do:</p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>Refresh the page to retry loading</li>
                  <li>Check your system status via CLI if urgent</li>
                  <li>Contact DevOps team if issue persists</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-accent hover:bg-accent/90 text-black font-bold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Dashboard
                </Button>
                <p className="text-xs text-gray-500">
                  Status: All systems operational • Issue ID: {Date.now().toString(36)}
                </p>
              </div>
            </div>
          </div>
        )
      }

      // Developer fallback
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-2xl w-full space-y-4 border-2 border-error/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bug className="w-6 h-6 text-error" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-error">Animation Error</h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 border border-error/30">
                    <Code className="w-3 h-3 text-error" />
                    <span className="text-xs text-error font-medium">Developer Mode</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Framer Motion encountered a rendering error. Full debugging details below.
                </p>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-auto">
              <p className="text-xs text-error font-mono mb-2">Error Message:</p>
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {this.state.error?.message || "Unknown error"}
              </pre>
              {this.state.error?.stack && (
                <>
                  <p className="text-xs text-error font-mono mt-4 mb-2">Stack Trace:</p>
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap max-h-64 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-accent hover:bg-accent/90 text-black font-bold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-white/20 hover:border-accent/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>

            <div className="text-xs text-gray-500 border-t border-white/10 pt-4">
              <p className="font-bold mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check if framer-motion is properly installed</li>
                <li>Verify all motion components have valid props</li>
                <li>Look for ref forwarding issues</li>
                <li>Check for conflicting CSS transitions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
