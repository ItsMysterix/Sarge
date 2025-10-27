'use client'

import { useState } from 'react'
import { StepDetect } from '@/components/oneclick/step-detect'
import { StepPlan } from '@/components/oneclick/step-plan'
import { StepObserve } from '@/components/oneclick/step-observe'

type Step = 'detect' | 'plan' | 'observe'
type Blueprint = any
type Plan = any

export default function OneClickPage() {
  const [step, setStep] = useState<Step>('detect')
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">One-Click Deploy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan your repo, preview infrastructure changes, and run locally—offline-first with full observability.
          </p>
        </header>

        {/* Stepper */}
        <nav className="mb-8 flex items-center gap-4" aria-label="Progress">
          {(['detect', 'plan', 'observe'] as const).map((s, idx) => {
            const isActive = step === s
            const isDone = 
              (s === 'detect' && (step === 'plan' || step === 'observe')) ||
              (s === 'plan' && step === 'observe')
            return (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isDone
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${
                      isActive ? 'text-foreground' : isDone ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      isDone ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </nav>

        {/* Step content */}
        {step === 'detect' && (
          <StepDetect
            onNext={(bp: any) => {
              setBlueprint(bp)
              setStep('plan')
            }}
          />
        )}
        {step === 'plan' && blueprint && (
          <StepPlan
            blueprint={blueprint}
            onBack={() => setStep('detect')}
            onNext={(p: any) => {
              setPlan(p)
              setStep('observe')
            }}
          />
        )}
        {step === 'observe' && plan && (
          <StepObserve
            plan={plan}
            onBack={() => setStep('plan')}
          />
        )}
      </div>
    </div>
  )
}
