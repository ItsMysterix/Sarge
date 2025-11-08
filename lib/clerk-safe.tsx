"use client"
import React from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

// Auth is always enabled with next-auth
export const CLERK_ENABLED = true

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

export function UserButton(props: any) {
  const { data: session } = useSession()
  
  if (!session?.user) return null
  
  return (
    <div className="flex items-center gap-2">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || "User"}
          className="w-8 h-8 rounded-full"
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign Out
      </Button>
    </div>
  )
}

export function SignedIn({ children }: { children?: React.ReactNode }) {
  const { status } = useSession()
  return status === "authenticated" ? <>{children}</> : null
}

export function SignedOut({ children }: { children?: React.ReactNode }) {
  const { status } = useSession()
  return status !== "authenticated" ? <>{children}</> : null
}
