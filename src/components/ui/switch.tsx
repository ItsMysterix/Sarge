"use client"

import * as React from "react"
import clsx from "clsx"

export type SwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: "sm" | "md"
}

export function Switch({ checked, onCheckedChange, disabled, className, size = "md" }: SwitchProps) {
  const trackSize = size === "sm" ? "w-10 h-5" : "w-12 h-6"
  const knobSize = size === "sm" ? "w-4 h-4" : "w-4 h-4"
  const translate = checked
    ? size === "sm" ? "translate-x-5" : "translate-x-7"
    : "translate-x-1"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={clsx(
        "relative rounded-full transition-colors",
        trackSize,
        checked ? "bg-accent" : "bg-white/10",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={clsx(
          "absolute top-1 rounded-full bg-white transition-transform",
          knobSize,
          translate
        )}
      />
    </button>
  )
}

export default Switch
