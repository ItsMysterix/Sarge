"use client"
import React from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function useUser() {
  const { data: session, status } = useSession()
  return {
    isLoaded: status !== "loading",
    isSignedIn: status === "authenticated",
    user: session?.user
      ? {
          id: session.user.id,
          emailAddresses: [{ emailAddress: session.user.email }],
          firstName: session.user.name?.split(" ")[0] || "",
          lastName: session.user.name?.split(" ")[1] || "",
          fullName: session.user.name || "",
          imageUrl: session.user.image || "",
        }
      : null,
  } as const
}

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    isLoaded: status !== "loading",
    isSignedIn: status === "authenticated",
    sessionId: session ? "session" : null,
    userId: session?.user?.id || null,
    signOut: () => signOut({ callbackUrl: "/" }),
  } as any
}

export { UserButton } from "./clerk-safe/user-button"
export { SignedIn } from "./clerk-safe/signed-in"
export { SignedOut } from "./clerk-safe/signed-out"
