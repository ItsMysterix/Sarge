"use client"

import { useUser, useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { Bug } from "lucide-react"

export function AuthDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  const { sessionId, userId } = useAuth()

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="glass-card p-2 text-accent hover:bg-accent/20 transition-colors rounded"
      >
        <Bug className="w-4 h-4" />
      </button>

      {showDebug && (
        <div className="absolute bottom-12 right-0 glass-card p-4 rounded-lg border border-white/10 w-80 text-xs">
          <div className="font-bold text-accent mb-2">Auth Debug Info</div>
          <div className="space-y-1 text-gray-300">
            <div>isLoaded: {isLoaded ? "✅" : "❌"}</div>
            <div>isSignedIn: {isSignedIn ? "✅" : "❌"}</div>
            <div>userId: {userId || "null"}</div>
            <div>sessionId: {sessionId ? "✅" : "❌"}</div>
            <div>user.firstName: {user?.firstName || "null"}</div>
            <div>user.email: {user?.emailAddresses?.[0]?.emailAddress || "null"}</div>
            <div>Current URL: {window.location.pathname}</div>
          </div>
        </div>
      )}
    </div>
  )
}
