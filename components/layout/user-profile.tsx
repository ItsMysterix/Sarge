"use client"

import { UserButton, useUser } from "@/lib/clerk-safe"
import Link from "next/link"

export function UserProfile() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-white/10 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/profile" className="text-sm text-gray-300 hover:text-accent transition-colors cursor-pointer group">
        Welcome, <span className="text-accent font-medium group-hover:underline">{user?.firstName || user?.fullName || "User"}</span>
      </Link>

      <UserButton />
    </div>
  )
}
