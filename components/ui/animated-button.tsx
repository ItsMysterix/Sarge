"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { forwardRef } from "react"

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
  variant?: "default" | "ghost" | "outline"
  glowColor?: string
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, variant = "default", glowColor, className = "", ...props }, ref) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200"
    
    const variantClasses = {
      default: "bg-accent hover:bg-accent/90 text-black font-bold",
      ghost: "bg-transparent hover:bg-white/10",
      outline: "border border-white/20 hover:border-accent/50 bg-transparent"
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: glowColor ? 0.2 : 0 }}
          style={{ 
            background: glowColor ? `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` : "transparent" 
          }}
          transition={{ duration: 0.3 }}
        />
        {children}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"
