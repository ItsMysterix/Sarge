'use client'

import { motion } from 'framer-motion'
import { Brain, Github, Rocket, Package, CheckCircle2 } from 'lucide-react'

interface WelcomeCardProps {
  user: any
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  const steps = [
    { icon: Github, label: 'Connect GitHub Repository', completed: false, description: 'Link your code to start deploying' },
    { icon: Package, label: 'Create Your First Stack', completed: false, description: 'Compose services into applications' },
    { icon: Rocket, label: 'Deploy to Local AWS', completed: false, description: 'Run your app offline with S3, DynamoDB, Lambda' },
  ]

  return (
    <motion.div 
      className="glass-card p-6 mb-6 border border-accent/20 rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between mb-4">
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
            <div className="text-sm text-gray-400">Your local AWS infrastructure is ready</div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="text-sm font-semibold text-gray-300 mb-3">🚀 Quick Start Guide</div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              <div className={`p-2 rounded-lg ${step.completed ? 'bg-success/20' : 'bg-accent/10'}`}>
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <step.icon className="w-4 h-4 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{step.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-accent/5 rounded-lg border border-accent/20">
          <div className="text-xs text-gray-300">
            💡 <span className="font-semibold">Pro Tip:</span> Use the <span className="text-accent font-mono">Quick Deploy</span> button to deploy without connecting a repository. Perfect for testing AWS services offline!
          </div>
        </div>
      </div>
    </motion.div>
  )
}
