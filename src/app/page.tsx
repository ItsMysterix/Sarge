"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/clerk-safe"
import { LoadingScreen } from "@/components/ui/loading-screen"

/**
 * Root Page Controller
 * 
 * Handles initial entry and redirects to appropriate workspaces:
 * 1. Not logged in -> Landing Page
 * 2. Logged in -> Projects List (Entry Hub)
 * 
 * Per User Request: The project list is the preferred landing point 
 * to keep the sidebar focused until a project is explicitly entered.
 */
export default function RootPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Redirect to projects list to maintain the "clean" sidebar state
        router.push("/projects")
      } else {
        // Not authenticated
        router.push("/landing")
      }
    }
  }, [isLoaded, isSignedIn, router])

  // Show a clean loading state while redirecting
  return (
    <div className="h-screen w-full bg-background flex items-center justify-center">
      <LoadingScreen title="Routing" subtitle="Preparing your workspace..." />
    </div>
  )
}
