'use client'

import { motion } from 'framer-motion'
import { Brain, FolderGit2 } from 'lucide-react'
import { useProject } from '@/lib/project-context'
import { useRouter } from 'next/navigation'

interface WelcomeCardProps {
  user: any
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  const { currentProject } = useProject()
  const router = useRouter()

  return (
    <motion.div 
      className="glass-card p-6 mb-6 border border-accent/20 rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="p-2 bg-accent/10 rounded-lg"
          >
            <Brain className="w-6 h-6 text-accent" />
          </motion.div>
          <div>
            <div className="text-lg font-bold">Welcome back, {user?.firstName || user?.username || "Commander"}!</div>
            <div className="text-sm text-gray-400">
              {currentProject ? (
                <span>Working on <span className="text-accent font-medium">{currentProject.name}</span></span>
              ) : (
                "Your local AWS infrastructure is ready"
              )}
            </div>
          </div>
        </div>
        
        {/* Project Switcher Button */}
        {currentProject && (
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 px-4 py-2 text-sm glass-card border border-white/10 rounded-lg hover:border-accent/50 hover:bg-accent/10 transition-all"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Switch Project</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

