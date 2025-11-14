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

"use client";

import React, { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnimationErrorBoundaryProps {
  children: ReactNode;
}

function FallbackUI({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
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
            onClick={resetErrorBoundary}
            className="w-full bg-accent hover:bg-accent/90 text-black font-bold"
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
  );
}

export function AnimationErrorBoundary({ children }: AnimationErrorBoundaryProps) {
  return (
    <ErrorBoundary FallbackComponent={FallbackUI}>
      {children}
    </ErrorBoundary>
  );
}
  }
