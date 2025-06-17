"use client"

import { UserButton, useUser } from "@clerk/nextjs"

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
        Welcome, <span className="text-accent font-medium">{user?.firstName || user?.username || "User"}</span>
      </div>

      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8 border-2 border-accent/30 hover:border-accent transition-colors",
            userButtonPopoverCard: "glass-card border border-white/10 bg-[#1a1a1a]",
            userButtonPopoverActionButton: "text-white hover:bg-white/10 transition-colors",
            userButtonPopoverActionButtonText: "text-white",
            userButtonPopoverActionButtonIcon: "text-accent",
            userButtonPopoverFooter: "border-t border-white/10",
          },
        }}
        userProfileMode="navigation"
        userProfileUrl="/user-profile"
      />
    </div>
  )
}
