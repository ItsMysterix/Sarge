"use client"

import { UserButton, useUser } from "@/lib/clerk-safe"

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
      <div className="text-sm text-gray-300">
        Welcome, <span className="text-accent font-medium">{user?.firstName || user?.fullName || "User"}</span>
      </div>

      <UserButton />
    </div>
  )
}
