'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'

interface StepDetectProps {
  onNext: (blueprint: any) => void
}

export function StepDetect({ onNext }: StepDetectProps) {
  const [path, setPath] = useState('')
  const [useConnectedRepo, setUseConnectedRepo] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [blueprint, setBlueprint] = useState<any>(null)
  const [connectedRepo, setConnectedRepo] = useState<any>(null)

  const detectMutation = (trpc.sarge as any).oneclick.detectRepo.useMutation()

  // Fetch connected repository on mount
  useEffect(() => {
    async function fetchRepo() {
      try {
        const response = await fetch('/api/repository')
        if (response.ok) {
          const data = await response.json()
          if (data.repository) {
            setConnectedRepo(data.repository)
            // Auto-fill with connected repo
            setPath(`github:${data.repository.owner}/${data.repository.repo}`)
          }
        }
      } catch (err) {
        console.error('Failed to fetch connected repo:', err)
      }
    }
    fetchRepo()
  }, [])

  const handleDetect = async () => {
    try {
      const bp = await detectMutation.mutateAsync({ path })
      setBlueprint(bp)
      setIsEditing(true)
    } catch (err: any) {
      console.error('Detection failed:', err)
    }
  }

  const handleNext = () => {
    if (blueprint) {
      onNext(blueprint)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold">1. Detect Stack</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Point to your repo—we'll scan for services, AWS resources (S3, DynamoDB, Lambda), ports, and env keys. No cloud account needed.
        </p>

        <div className="space-y-4">
          {/* Connected Repository Info */}
          {connectedRepo && (
            <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-500/20 p-2 text-blue-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Connected Repository Detected</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{connectedRepo.full_name}</span> is ready for one-click deployment
                  </p>
                  <button
                    onClick={() => setUseConnectedRepo(!useConnectedRepo)}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    {useConnectedRepo ? 'Use different path' : 'Use connected repository'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="repo-path" className="mb-2 block text-sm font-medium">
              Repository Path {useConnectedRepo && connectedRepo && <span className="text-muted-foreground">(auto-filled)</span>}
            </label>
            <div className="flex gap-2">
              <input
                id="repo-path"
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDetect()}
                disabled={useConnectedRepo && !!connectedRepo}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="github:owner/repo or /path/to/your/repo"
                aria-label="Repository path"
              />
              <button
                onClick={handleDetect}
                disabled={detectMutation.isPending || !path}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {detectMutation.isPending ? 'Detecting...' : 'Detect'}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports local paths, GitHub repos (github:owner/repo), or connected repositories
            </p>
          </div>

          {detectMutation.isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Detection failed. Verify the path exists and contains a recognized project manifest (package.json, docker-compose.yml, etc.).
            </div>
          )}

          {blueprint && isEditing && (
            <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Detected Stack Blueprint</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {blueprint.services?.length || 0} services
                </span>
              </div>

              {/* Services */}
              {blueprint.services && blueprint.services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Services</p>
                  <div className="space-y-2">
                    {blueprint.services.map((svc: any, idx: number) => (
                      <div key={idx} className="rounded border border-border bg-background p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{svc.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {svc.type}
                          </span>
                        </div>
                        {svc.ports && svc.ports.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ports: {svc.ports.join(', ')}
                          </p>
                        )}
                        {svc.envKeys && svc.envKeys.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Env: {svc.envKeys.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {(blueprint.resources?.s3Buckets?.length > 0 ||
                blueprint.resources?.dynamoTables?.length > 0 ||
                blueprint.resources?.lambdaFunctions?.length > 0) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resources</p>
                  <div className="space-y-1 text-sm">
                    {blueprint.resources.s3Buckets?.map((b: string) => (
                      <div key={b} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">🪣</span>
                        <span className="font-mono text-xs">{b}</span>
                      </div>
                    ))}
                    {blueprint.resources.dynamoTables?.map((t: any) => (
                      <div key={t.name} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">📊</span>
                        <span className="font-mono text-xs">{t.name}</span>
                      </div>
                    ))}
                    {blueprint.resources.lambdaFunctions?.map((f: any) => (
                      <div key={f.name} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">λ</span>
                        <span className="font-mono text-xs">{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(!blueprint.services || blueprint.services.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No services found. Ensure your repo has package.json, docker-compose.yml, or supported config files.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {blueprint && isEditing && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Next: Plan
          </button>
        </div>
      )}
    </div>
  )
}
