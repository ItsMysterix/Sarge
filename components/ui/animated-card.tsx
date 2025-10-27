"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
}

export function AnimatedCard({ 
  children, 
  className = "", 
  delay = 0, 
  hover = true,
  onClick 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`glass-card cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedList({ 
  children, 
  className = "", 
  staggerDelay = 0.1 
}: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedListItem({ 
  children, 
  className = "" 
}: { 
  children: ReactNode 
  className?: string 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
