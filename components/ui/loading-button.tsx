"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

interface LoadingButtonProps {
  loading: boolean
  children: ReactNode
  loadingText?: string
  onClick?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  disabled?: boolean
}

export function LoadingButton({
  loading,
  children,
  loadingText,
  onClick,
  variant = "default",
  className,
  disabled,
}: LoadingButtonProps) {
  return (
    <Button onClick={onClick} disabled={loading || disabled} variant={variant} className={className}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText || "Loading..." : children}
    </Button>
  )
}
