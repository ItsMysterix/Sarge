"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Brain, Rocket, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FirstTimeSetup() {
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const steps = [
    {
      title: "Welcome to Sarge!",
      description: `Hi ${user?.firstName || "there"}! Let's get your DevOps command center set up.`,
      icon: Brain,
      color: "text-accent",
    },
    {
      title: "Connect Your Infrastructure",
      description: "We'll help you connect your services and start monitoring your deployments.",
      icon: Rocket,
      color: "text-warning",
    },
    {
      title: "You're All Set!",
      description: "Your command center is ready. Let's explore your dashboard.",
      icon: CheckCircle,
      color: "text-success",
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsCompleting(true)
      // Here you could save user preferences or mark setup as complete
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-lg border border-white/10 max-w-md w-full">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-8 h-8 ${currentStepData.color}`} />
          </div>

          <h2 className="text-2xl font-bold mb-4">{currentStepData.title}</h2>
          <p className="text-gray-400 mb-8">{currentStepData.description}</p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i <= currentStep ? "bg-accent" : "bg-white/20"}`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={isCompleting}
            className="w-full bg-accent hover:bg-accent/90 text-black font-bold"
          >
            {isCompleting ? (
              "Setting up..."
            ) : currentStep === steps.length - 1 ? (
              "Enter Dashboard"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
