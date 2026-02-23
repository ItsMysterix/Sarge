"use client"
import React from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

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
