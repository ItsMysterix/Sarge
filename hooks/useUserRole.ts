"use client"

import { useUser } from "@/lib/clerk-safe"

export type UserRole = "developer" | "manager" | "viewer"

export function useUserRole(): UserRole {
  const { user } = useUser()
  
  // Check Clerk public metadata for role
  const clerkRole = user?.publicMetadata?.role as UserRole | undefined
  
  // Fallback logic
  if (clerkRole) return clerkRole
  
  // If in development mode, assume developer
  if (process.env.NODE_ENV === "development") return "developer"
  
  // Check email domain (you can customize this)
  const email = user?.primaryEmailAddress?.emailAddress
  if (email) {
    // Internal team emails = developer access
    if (email.includes("@yourcompany.com") || email.includes("@internal.")) {
      return "developer"
    }
  }
  
  // Default to viewer for safety
  return "viewer"
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV === "development"
}

export function isDeveloper(role: UserRole): boolean {
  return role === "developer"
}

export function canViewDetailedErrors(role: UserRole): boolean {
  return role === "developer"
}

export function canPerformActions(role: UserRole): boolean {
  return role === "developer" || role === "manager"
}
