"use client"

import React, { Component, ReactNode } from "react"
import { 
  AlertTriangle, Bug, RefreshCw, Code, 
  ShieldOff, WifiOff, Edit3, Database, Settings,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ERROR_REGISTRY, categorizeError, getErrorDetails } from "@/lib/error-registry"

interface Props {
  children: ReactNode
  fallbackType?: "user" | "developer" | "auto"
}

interface State {
  hasError: boolean
  error: Error | null
}

const ICON_MAP: Record<string, any> = {
  AlertTriangle,
  ShieldOff,
  WifiOff,
  Edit3,
  Database,
  Settings,
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development"
      const error = this.state.error
      const details = getErrorDetails(error)
      const category = categorizeError(error)
      const Icon = ICON_MAP[details.icon || 'AlertTriangle'] || AlertTriangle
      
      let fallbackType = this.props.fallbackType || "auto"
      if (fallbackType === "auto") {
        fallbackType = isDev ? "developer" : "user"
      }

      if (fallbackType === "user") {
        return (
          <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full text-center space-y-4 border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white/50" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{details.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  {details.message}
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => {
                    if (category === 'auth') window.location.href = '/sign-in';
                    else if (category === 'data') window.history.back();
                    else window.location.reload();
                  }}
                  className="w-full bg-white text-black font-bold hover:bg-white/90 transition-all h-11"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {details.action}
                </Button>
                
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pt-4">
                  Incident ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )
      }

      // Developer fallback
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Runtime Exception</span>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {category} error
              </div>
            </div>

            <div className="bg-[#0f0f15] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
              
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Bug className="w-6 h-6 text-white/40" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white mb-2 truncate">
                    {error?.name || "Error"}: {error?.message || "Unknown error"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                    An unhandled exception occurred in the render lifecycle or an effect.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Code className="w-3 h-3" />
                        Stack Trace
                      </div>
                      <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-auto max-h-[300px] scrollbar-thin">
                        <pre className="text-xs font-mono text-white/70 whitespace-pre leading-relaxed">
                          {error?.stack}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-3">
                <Button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="bg-white text-black font-bold h-10 px-6 hover:bg-white/90"
                >
                  Hot Reload
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-white/10 text-white font-bold h-10 px-6 hover:bg-white/5"
                >
                   Hard Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
