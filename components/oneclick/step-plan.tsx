'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

interface StepPlanProps {
  blueprint: any
  onBack: () => void
  onNext: (plan: any) => void
}

export function StepPlan({ blueprint, onBack, onNext }: StepPlanProps) {
  const [plan, setPlan] = useState<any>(null)

  const planMutation = (trpc.sarge as any).oneclick.plan.useMutation()

  const handlePlan = async () => {
    try {
      const p = await planMutation.mutateAsync({ blueprint })
      setPlan(p)
    } catch (err: any) {
      console.error('Plan failed:', err)
    }
  }

  const handleApply = () => {
    if (plan) {
      onNext(plan)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">2. Plan Changes</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Preview exactly what will run. We assign ports, validate env vars, and surface conflicts—before any process starts.
        </p>

        {!plan && (
          <button
            onClick={handlePlan}
            disabled={planMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {planMutation.isPending ? 'Planning...' : 'Generate Plan'}
          </button>
        )}

        {planMutation.isError && (
          <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Planning failed. Check the blueprint for missing required fields or unsupported service types.
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            {/* Issues */}
            {plan.issues && plan.issues.length > 0 && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  ⚠️ Validation Issues ({plan.issues.length})
                </h3>
                <ul className="space-y-1 text-sm">
                  {plan.issues.map((issue: any, idx: number) => (
                    <li key={idx} className="text-muted-foreground">
                      {issue.kind === 'port-conflict' && (
                        <>
                          Port conflict for <span className="font-mono">{issue.service}</span>: requested {issue.requested}, assigned {issue.assigned}
                        </>
                      )}
                      {issue.kind === 'reserved-port' && (
                        <>
                          Reserved port for <span className="font-mono">{issue.service}</span>: requested {issue.requested}, assigned {issue.assigned}
                        </>
                      )}
                      {issue.kind === 'missing-env' && (
                        <>
                          Missing env <span className="font-mono">{issue.key}</span> for services: {issue.services.join(', ')}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Service operations */}
            {plan.serviceOps && plan.serviceOps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Service Operations</h3>
                <div className="space-y-1">
                  {plan.serviceOps.map((op: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      {op.op === 'start' && <span className="text-green-500">▶️</span>}
                      {op.op === 'restart' && <span className="text-yellow-500">🔄</span>}
                      {op.op === 'stop' && <span className="text-red-500">⏹️</span>}
                      <span className="font-mono font-medium">{op.name}</span>
                      <span className="text-muted-foreground">({op.op})</span>
                      {op.ports && op.ports.length > 0 && (
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          :{op.ports[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource operations */}
            {plan.resourceOps && plan.resourceOps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Resource Operations</h3>
                <div className="space-y-1">
                  {plan.resourceOps.map((op: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      {op.op === 'create' && <span className="text-green-500">+</span>}
                      {op.op === 'update' && <span className="text-blue-500">~</span>}
                      {op.op === 'delete' && <span className="text-red-500">-</span>}
                      <span className="text-muted-foreground">{op.resourceType}</span>
                      <span className="font-mono text-xs">{op.payload?.name || JSON.stringify(op.payload)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan text */}
            {plan.planText && (
              <div className="rounded-lg bg-muted p-4 font-mono text-xs">
                <pre className="whitespace-pre-wrap">{plan.planText}</pre>
              </div>
            )}

            {/* Empty state */}
            {(!plan.serviceOps || plan.serviceOps.length === 0) &&
              (!plan.resourceOps || plan.resourceOps.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No changes planned.</p>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back
        </button>
        {plan && (
          <button
            onClick={handleApply}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Apply & Observe
          </button>
        )}
      </div>
    </div>
  )
}
