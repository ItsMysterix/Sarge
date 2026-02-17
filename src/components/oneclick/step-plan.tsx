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
  const [customPorts, setCustomPorts] = useState<Record<string, number>>({})
  const [showPortEditor, setShowPortEditor] = useState(false)

  const planMutation = (trpc.sarge as any).oneclick.plan.useMutation()

  // Initialize custom ports from blueprint
  const initializePorts = () => {
    const ports: Record<string, number> = {}
    blueprint.services?.forEach((svc: any) => {
      if (svc.ports && svc.ports.length > 0) {
        ports[svc.name] = svc.ports[0]
      }
    })
    setCustomPorts(ports)
    setShowPortEditor(true)
  }

  const handlePlan = async () => {
    try {
      // Apply custom ports to blueprint before planning
      const updatedBlueprint = {
        ...blueprint,
        services: blueprint.services?.map((svc: any) => ({
          ...svc,
          ports: customPorts[svc.name] ? [customPorts[svc.name]] : svc.ports
        }))
      }
      const p = await planMutation.mutateAsync({ blueprint: updatedBlueprint })
      setPlan(p)
      setShowPortEditor(false)
    } catch (err: any) {
      console.error('Plan failed:', err)
    }
  }

  const handlePortChange = (serviceName: string, port: number) => {
    setCustomPorts(prev => ({ ...prev, [serviceName]: port }))
  }

  const handleApply = () => {
    if (plan) {
      onNext(plan)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold">2. Plan & Configure Ports</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Preview exactly what will run. Customize ports, validate env vars, and surface conflicts—before any process starts.
        </p>

        {/* Port Customization */}
        {!plan && blueprint.services && blueprint.services.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Detected Services</h3>
              {!showPortEditor ? (
                <button
                  onClick={initializePorts}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Customize Ports
                </button>
              ) : (
                <button
                  onClick={() => setShowPortEditor(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Hide Editor
                </button>
              )}
            </div>

            <div className="space-y-3">
              {blueprint.services.map((svc: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{svc.name}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {svc.type}
                        </span>
                      </div>
                      {svc.startCommand && (
                        <p className="mt-1 text-xs text-muted-foreground font-mono">
                          {svc.startCommand}
                        </p>
                      )}
                    </div>
                    
                    {showPortEditor && svc.ports && svc.ports.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Port:</label>
                        <input
                          type="number"
                          min="1024"
                          max="65535"
                          value={customPorts[svc.name] || svc.ports[0]}
                          onChange={(e) => handlePortChange(svc.name, parseInt(e.target.value))}
                          className="w-20 rounded border border-input bg-background px-2 py-1 text-sm"
                        />
                      </div>
                    )}
                    
                    {!showPortEditor && svc.ports && svc.ports.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Port: <span className="font-mono">{svc.ports[0]}</span>
                      </div>
                    )}
                  </div>
                  
                  {svc.envKeys && svc.envKeys.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Env vars: {svc.envKeys.slice(0, 5).join(', ')}
                        {svc.envKeys.length > 5 && ` +${svc.envKeys.length - 5} more`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AWS Resources Preview */}
            {(blueprint.resources?.s3Buckets?.length > 0 ||
              blueprint.resources?.dynamoTables?.length > 0 ||
              blueprint.resources?.lambdaFunctions?.length > 0) && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  🪣 AWS Resources (Will be Emulated)
                </h3>
                <div className="space-y-1 text-xs">
                  {blueprint.resources.s3Buckets?.map((b: string) => (
                    <div key={b} className="flex items-center gap-2 text-muted-foreground">
                      <span>S3:</span>
                      <span className="font-mono">{b}</span>
                    </div>
                  ))}
                  {blueprint.resources.dynamoTables?.map((t: any) => (
                    <div key={t.name} className="flex items-center gap-2 text-muted-foreground">
                      <span>DynamoDB:</span>
                      <span className="font-mono">{t.name}</span>
                    </div>
                  ))}
                  {blueprint.resources.lambdaFunctions?.map((f: any) => (
                    <div key={f.name} className="flex items-center gap-2 text-muted-foreground">
                      <span>Lambda:</span>
                      <span className="font-mono">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!plan && (
          <button
            onClick={handlePlan}
            disabled={planMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {planMutation.isPending ? 'Planning...' : 'Generate Deployment Plan'}
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
