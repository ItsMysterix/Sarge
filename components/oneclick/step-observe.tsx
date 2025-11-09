'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { FeatureGate } from '@/components/ui/feature-gate'

interface StepObserveProps {
  plan: any
  onBack: () => void
}

export function StepObserve({ plan, onBack }: StepObserveProps) {
  const [result, setResult] = useState<any>(null)
  const [dockerMode, setDockerMode] = useState(false)

  const applyMutation = (trpc.sarge as any).oneclick.apply.useMutation()
  const statusQuery = (trpc.sarge as any).oneclick.status.useQuery(
    { stackId: 'default' },
    { enabled: !!result, refetchInterval: 3000 }
  )
  const toggleDockerMutation = (trpc.sarge as any).oneclick.toggleDocker.useMutation()
  const costQuery = (trpc.sarge as any).cost.estimate.useQuery({ stackId: 'default' }, { refetchInterval: 60000 })
  const tracesListQuery = (trpc as any).traces.list.useQuery(undefined, { refetchInterval: 10000 })
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null)
  const traceDetailQuery = (trpc as any).traces.get.useQuery(
    activeTraceId ? { traceId: activeTraceId } : (undefined as any),
    { enabled: !!activeTraceId }
  )

  // Auto-apply is performed only when licensed via inner component
  function AutoApply() {
    useEffect(() => {
      let cancelled = false
      const run = async () => {
        try {
          const res = await applyMutation.mutateAsync({ plan })
          if (!cancelled) setResult(res)
        } catch (err: any) {
          console.error('Apply failed:', err)
        }
      }
      run()
      return () => { cancelled = true }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
  }

  const handleToggleDocker = async () => {
    try {
      await toggleDockerMutation.mutateAsync({ enabled: !dockerMode })
      setDockerMode(!dockerMode)
    } catch (err: any) {
      console.error('Toggle Docker failed:', err)
    }
  }

  const handleSnapshot = () => {
    // TODO: wire to sarge.workspace.snapshots.create
    console.log('Snapshot requested')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">3. Observe & Manage</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSnapshot}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              📸 Snapshot
            </button>
            <button
              onClick={handleToggleDocker}
              disabled={toggleDockerMutation.isPending}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                dockerMode
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              🐳 Docker {dockerMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Stack is live. View health, URLs, and logs. Toggle Docker mode to switch runtimes. Snapshot anytime for reproducible rollback.
        </p>

        {applyMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Applying plan...</span>
          </div>
        )}

        {applyMutation.isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Apply failed. Check logs in data/sarge/logs/ or review the plan for validation issues.
          </div>
        )}

  <FeatureGate feature="cloudApply" title="Cloud Apply is locked">
  <AutoApply />
        {/* The observing UI also covers local apply. If locked, the gate above shows messaging and children won't render. */}
        {result && (
          <div className="space-y-4">
            {/* Status banner */}
            <div
              className={`rounded-lg border px-4 py-3 ${
                result.status === 'started'
                  ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{result.status === 'started' ? '✅' : '❌'}</span>
                <span className="font-semibold">
                  {result.status === 'started' ? 'Stack Running' : 'Stack Failed'}
                </span>
              </div>
            </div>

            {/* Service URLs */}
            {result.urls && result.urls.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Service URLs</h3>
                <div className="space-y-1">
                  {result.urls.map((u: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2"
                    >
                      <span className="font-mono text-sm font-medium">{u.service}</span>
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {u.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-destructive">Errors</h3>
                <ul className="space-y-1 text-sm">
                  {result.errors.map((e: string, idx: number) => (
                    <li key={idx} className="font-mono text-xs text-muted-foreground">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Health summary */}
            {statusQuery.data && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Health Summary</h3>
                <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusQuery.data.healthy ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-muted-foreground">
                      {statusQuery.data.healthy ? 'All systems operational' : 'Issues detected'}
                    </span>
                  </div>
                  {statusQuery.data.services && statusQuery.data.services.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {statusQuery.data.services.length} service(s) tracked
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Logs tail placeholder */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Logs</h3>
              <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-xs">
                <p className="text-muted-foreground">
                  Live tail coming soon. Structured logs in <span className="font-mono">data/sarge/logs/</span> (JSON, one line per event).
                </p>
              </div>
            </div>

            {/* Traces (local) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Traces</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                {tracesListQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading traces...</span>
                  </div>
                )}
                {tracesListQuery.data && tracesListQuery.data.items.length === 0 && (
                  <div className="text-xs text-muted-foreground">No traces yet. Actions will generate local spans.</div>
                )}
                {tracesListQuery.data && tracesListQuery.data.items.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {tracesListQuery.data.items.slice(0, 5).map((t: any) => (
                      <button key={t.traceId} onClick={() => setActiveTraceId(t.traceId)} className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${activeTraceId===t.traceId? 'border-primary/60 bg-primary/10' : 'border-border bg-background/50 hover:bg-accent/50'}`}>
                        <span className="font-mono">{t.rootName}</span>
                        <span className="font-mono text-muted-foreground">{Math.round(t.durationMs)} ms · {t.spanCount} spans</span>
                      </button>
                    ))}
                  </div>
                )}
                {activeTraceId && traceDetailQuery.data && traceDetailQuery.data.found && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">trace {activeTraceId}</span>
                      <button onClick={() => setActiveTraceId(null)} className="rounded border border-input bg-background px-2 py-0.5 text-xs hover:bg-accent">Close</button>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-[480px] space-y-1">
                        {traceDetailQuery.data.detail.spans.map((s: any, idx: number) => {
                          const offset = Math.max(0, s.startTimeUnixMs - traceDetailQuery.data.detail.summary.startTimeUnixMs)
                          const width = Math.max(2, Math.round((s.endTimeUnixMs - s.startTimeUnixMs) / Math.max(1, traceDetailQuery.data.detail.summary.durationMs) * 100))
                          const left = Math.round(offset / Math.max(1, traceDetailQuery.data.detail.summary.durationMs) * 100)
                          return (
                            <div key={idx} className="relative h-6">
                              <div className="absolute left-0 top-0 flex h-full items-center">
                                <span className="font-mono text-[10px] text-muted-foreground">{s.name}</span>
                              </div>
                              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%`, width: `${width}%` }}>
                                <div className="h-3 rounded bg-primary/60" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cost estimate */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Estimated Monthly Cost</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                {costQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Estimating...</span>
                  </div>
                )}
                {costQuery.data && (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Pricing version</span>
                      <span className="font-mono text-xs">{costQuery.data.pricingVersion}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="font-mono text-lg">${'{'}costQuery.data.totalMonthlyUSD.toFixed(2){'}'}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between rounded border border-border bg-background/50 px-2 py-1"><span>S3</span><span className="font-mono">${'{'}(costQuery.data.breakdown.s3.storageUSD + costQuery.data.breakdown.s3.requestsUSD).toFixed(2){'}'}</span></div>
                      <div className="flex items-center justify-between rounded border border-border bg-background/50 px-2 py-1"><span>DynamoDB</span><span className="font-mono">${'{'}(costQuery.data.breakdown.dynamo.storageUSD + costQuery.data.breakdown.dynamo.requestsUSD).toFixed(2){'}'}</span></div>
                      <div className="flex items-center justify-between rounded border border-border bg-background/50 px-2 py-1"><span>Lambda</span><span className="font-mono">${'{'}(costQuery.data.breakdown.lambda.requestsUSD + costQuery.data.breakdown.lambda.computeUSD).toFixed(2){'}'}</span></div>
                      <div className="flex items-center justify-between rounded border border-border bg-background/50 px-2 py-1"><span>SQS</span><span className="font-mono">${'{'}(costQuery.data.breakdown.sqs.requestsUSD).toFixed(2){'}'}</span></div>
                      <div className="flex items-center justify-between rounded border border-border bg-background/50 px-2 py-1"><span>SNS</span><span className="font-mono">${'{'}(costQuery.data.breakdown.sns.requestsUSD).toFixed(2){'}'}</span></div>
                    </div>
                  </div>
                )}
                {costQuery.isError && (
                  <div className="rounded-md border border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">Cost estimate unavailable.</div>
                )}
              </div>
            </div>

            {/* Grafana link */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 text-sm font-semibold">Observability</h3>
              <p className="text-xs text-muted-foreground">
                Prometheus metrics: <span className="font-mono">data/sarge/metrics/metrics.prom</span>. Grafana dashboards: <span className="font-mono">data/sarge/dashboards/</span>. All offline-friendly.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Point your local Prometheus scraper to the metrics file, or use the bundled docker-compose for instant viz.
              </p>
            </div>
          </div>
        )}
        </FeatureGate>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Plan
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
