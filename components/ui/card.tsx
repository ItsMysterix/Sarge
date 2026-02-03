"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean
  delay?: number
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, animated, delay = 0, hover = false, children, ...props }, ref) => {
    const Comp = animated ? (motion.div as any) : "div"
    const motionProps = animated ? {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.5, delay },
      whileHover: hover ? { scale: 1.02, y: -5 } : {},
    } : {}

    return (
      <Comp
        ref={ref}
        className={cn(
          "rounded-lg border border-zinc-800 bg-zinc-900/60 transition-all",
          hover && !animated && "hover:border-zinc-700 hover:bg-zinc-900/80",
          className
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Card.displayName = "Card"

const CardHeader = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn("px-4 py-3 border-b border-zinc-800", className)}>{children}</div>
)

const CardBody = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn("p-4", className)}>{children}</div>
)

const CardFooter = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn("px-4 py-3 border-t border-zinc-800", className)}>{children}</div>
)


const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

// Alias CardBody as CardContent for compatibility
const CardContent = CardBody

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription, CardContent }
