'use client'

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

interface WelcomeCardProps {
  user: any
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  return (
    <motion.div 
      className="glass-card p-4 mb-6 border-l-4 border-l-accent"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01, x: 5 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Brain className="w-5 h-5 text-accent" />
        </motion.div>
        <div>
          <div className="font-medium">Welcome back, {user?.firstName || user?.username || "Commander"}!</div>
          <div className="text-sm text-gray-400">Your DevOps command center is ready.</div>
        </div>
      </div>
    </motion.div>
  )
}
