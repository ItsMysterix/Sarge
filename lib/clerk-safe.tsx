"use client"
import React from "react"
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  UserButton as ClerkUserButton,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
} from "@clerk/nextjs"
import { ENV } from "@/app/lib/env"

// Clerk is considered enabled only when a real publishable key is provided.
export const CLERK_ENABLED = ENV.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_mock"

export function useUser() {
  if (CLERK_ENABLED) return useClerkUser()
  return { isLoaded: true, isSignedIn: false, user: null } as const
}

export function useAuth() {
  if (CLERK_ENABLED) return useClerkAuth()
  return { isLoaded: true, isSignedIn: false, sessionId: null, userId: null } as any
}

export function UserButton(props: React.ComponentProps<typeof ClerkUserButton>) {
  if (CLERK_ENABLED) return <ClerkUserButton {...props} />
  return null
}

export function SignedIn({ children }: { children?: React.ReactNode }) {
  return CLERK_ENABLED ? <ClerkSignedIn>{children}</ClerkSignedIn> : null
}

export function SignedOut({ children }: { children?: React.ReactNode }) {
  return CLERK_ENABLED ? <ClerkSignedOut>{children}</ClerkSignedOut> : <>{children}</>
}
