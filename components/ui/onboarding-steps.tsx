"use client"

import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight } from "lucide-react"

interface OnboardingStep {
  number: number
  title: string
  description: string
  completed?: boolean
}

interface OnboardingStepsProps {
  steps: OnboardingStep[]
}

export function OnboardingSteps({ steps }: OnboardingStepsProps) {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {steps.map((step, index) => (
        <motion.div
          key={step.number}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.7 }}
          className={`
            relative p-6 rounded-lg border transition-all
            ${step.completed 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold
              ${step.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
              }
            `}>
              {step.completed ? <CheckCircle2 className="w-6 h-6" /> : step.number}
            </div>
            
            <div className="flex-1">
              <h3 className={`
                text-lg font-semibold mb-2
                ${step.completed ? 'text-green-400' : 'text-white'}
              `}>
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>

            {!step.completed && (
              <ArrowRight className="flex-shrink-0 w-5 h-5 text-gray-600" />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
