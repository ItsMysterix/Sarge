"use client"
import React from "react"
import { useSession } from "next-auth/react"

export function SignedOut({ children }: { children?: React.ReactNode }) {
  const { status } = useSession()
  return status !== "authenticated" ? <>{children}</> : null
}
