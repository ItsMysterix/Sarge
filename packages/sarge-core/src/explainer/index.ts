/**
 * Stack Explainer - generates deterministic markdown summaries from local facts
 * No external LLM; purely local data.
 */

export interface StackExplanation {
  markdown: string
  metadata: {
    generatedAt: string
    stackId: string
    version: string
  }
}

export interface ExplainStackInput {
  stackId: string
  dataRoot: string
  // Optional context for richer explanations
  context?: {
    services?: Array<{ id: string; name: string; kind: string; state: string; port?: number }>
    resources?: Array<{ id: string; kind: string; name: string; state?: string }>
    health?: Array<{ service: string; healthy: boolean; message?: string }>
    errors?: Array<{ service: string; message: string; timestamp: string; count?: number }>
    costEstimate?: { totalUSD: number; breakdown: Record<string, number> }
    lastDeploy?: { timestamp: string; changes?: Array<{ type: string; description: string }> }
  }
}

/**
 * Generate a concise markdown explanation of a stack's current state.
 * Uses only local facts; no external LLM calls.
 */
export function explainStack(input: ExplainStackInput): StackExplanation {
  const { stackId, dataRoot, context } = input
  const now = new Date().toISOString()
  
  const sections: string[] = []
  
  // Header
  sections.push(`# Stack: ${stackId}`)
  sections.push('')
  sections.push(`**Generated:** ${new Date(now).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`)
  sections.push('')
  
  // Topology summary
  sections.push('## Topology')
  const services = context?.services ?? []
  const resources = context?.resources ?? []
  
  if (services.length === 0 && resources.length === 0) {
    sections.push('No services or resources detected.')
  } else {
    sections.push(`This stack contains **${services.length} service(s)** and **${resources.length} resource(s)**.`)
    sections.push('')
    
    if (services.length > 0) {
      sections.push('### Services')
      for (const svc of services) {
        const portInfo = svc.port ? ` → [http://localhost:${svc.port}](http://localhost:${svc.port})` : ''
        const stateEmoji = svc.state === 'running' ? '✅' : svc.state === 'stopped' ? '⏸️' : '⚪'
        sections.push(`- ${stateEmoji} **${svc.name}** (${svc.kind})${portInfo}`)
      }
      sections.push('')
    }
    
    if (resources.length > 0) {
      sections.push('### Resources')
      const grouped = resources.reduce((acc, r) => {
        if (!acc[r.kind]) acc[r.kind] = []
        acc[r.kind].push(r)
        return acc
      }, {} as Record<string, typeof resources>)
      
      for (const [kind, items] of Object.entries(grouped)) {
        sections.push(`- **${kind}:** ${items.length} (${items.map(i => i.name).join(', ')})`)
      }
      sections.push('')
    }
  }
  
  // Health status
  sections.push('## Health')
  const health = context?.health ?? []
  if (health.length === 0) {
    sections.push('No health checks available.')
  } else {
    const healthy = health.filter(h => h.healthy).length
    const total = health.length
    const healthPct = total > 0 ? Math.round((healthy / total) * 100) : 0
    
    if (healthPct === 100) {
      sections.push(`✅ All services healthy (${healthy}/${total})`)
    } else if (healthPct >= 50) {
      sections.push(`⚠️ Partially healthy (${healthy}/${total} services passing)`)
    } else {
      sections.push(`❌ Unhealthy (${healthy}/${total} services passing)`)
    }
    
    const unhealthy = health.filter(h => !h.healthy)
    if (unhealthy.length > 0) {
      sections.push('')
      sections.push('**Issues:**')
      for (const h of unhealthy) {
        sections.push(`- ${h.service}: ${h.message ?? 'health check failed'}`)
      }
    }
  }
  sections.push('')
  
  // Top errors
  const errors = context?.errors ?? []
  if (errors.length > 0) {
    sections.push('## Top Errors')
    const topErrors = errors
      .sort((a, b) => (b.count ?? 1) - (a.count ?? 1))
      .slice(0, 5)
    
    for (const err of topErrors) {
      const countInfo = err.count && err.count > 1 ? ` (${err.count}x)` : ''
      sections.push(`- **${err.service}:** ${err.message}${countInfo}`)
    }
    sections.push('')
    sections.push('→ [View all logs](/logs)')
    sections.push('')
  }
  
  // Most active resources
  if (resources.length > 0) {
    sections.push('## Most Active Resources')
    // For now, show first 3 resources as a placeholder
    // In production, this would be sorted by metrics (requests, reads, writes, etc.)
    const topResources = resources.slice(0, 3)
    for (const r of topResources) {
      sections.push(`- **${r.name}** (${r.kind})`)
    }
    sections.push('')
    sections.push('→ [View metrics](/metrics)')
    sections.push('')
  }
  
  // Cost estimate
  const cost = context?.costEstimate
  if (cost) {
    sections.push('## Cost Estimate')
    sections.push(`**Total:** $${cost.totalUSD.toFixed(2)}/month (local simulation)`)
    
    if (Object.keys(cost.breakdown).length > 0) {
      sections.push('')
      sections.push('**Breakdown:**')
      for (const [category, amount] of Object.entries(cost.breakdown).sort((a, b) => b[1] - a[1])) {
        sections.push(`- ${category}: $${amount.toFixed(2)}`)
      }
    }
    sections.push('')
    sections.push('→ [View detailed cost analysis](/settings?tab=cost)')
    sections.push('')
  }
  
  // What changed since last deploy
  const lastDeploy = context?.lastDeploy
  if (lastDeploy) {
    sections.push('## Recent Changes')
    const deployDate = new Date(lastDeploy.timestamp)
    const elapsed = now ? Math.round((new Date(now).getTime() - deployDate.getTime()) / 1000 / 60) : 0
    const timeAgo = elapsed < 60 ? `${elapsed}m ago` : elapsed < 1440 ? `${Math.round(elapsed / 60)}h ago` : `${Math.round(elapsed / 1440)}d ago`
    
    sections.push(`Last deployed **${timeAgo}** (${deployDate.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })})`)
    
    const changes = lastDeploy.changes ?? []
    if (changes.length > 0) {
      sections.push('')
      sections.push('**Changes:**')
      for (const change of changes) {
        const emoji = change.type === 'added' ? '➕' : change.type === 'removed' ? '➖' : change.type === 'modified' ? '✏️' : '🔄'
        sections.push(`- ${emoji} ${change.description}`)
      }
    }
    sections.push('')
    sections.push('→ [View deployment history](/deployments)')
    sections.push('')
  }
  
  // Footer
  sections.push('---')
  sections.push('')
  sections.push('*Generated locally by Sarge without external LLM calls.*')
  
  return {
    markdown: sections.join('\n'),
    metadata: {
      generatedAt: now,
      stackId,
      version: '1.0.0',
    },
  }
}

/**
 * Helper: gather stack context from dataRoot filesystem
 * This is a convenience wrapper that reads local state files and builds ExplainStackInput.context
 */
export async function gatherStackContext(
  stackId: string,
  dataRoot: string,
  options?: {
    includeHealth?: boolean
    includeErrors?: boolean
    includeCost?: boolean
    includeLastDeploy?: boolean
  }
): Promise<ExplainStackInput['context']> {
  const fs = await import('fs')
  const path = await import('path')
  
  const context: ExplainStackInput['context'] = {
    services: [],
    resources: [],
    health: [],
    errors: [],
  }
  
  // Read state.json for services/resources if available
  const stateFile = path.join(dataRoot, 'state.json')
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8')) as any
      // Extract services from state
      if (state.workspace?.stacks) {
        const stack = state.workspace.stacks.find((s: any) => s.id === stackId || s.name === stackId)
        if (stack?.services) {
          context.services = stack.services.map((s: any) => ({
            id: s.id ?? s.name,
            name: s.name,
            kind: s.kind ?? 'service',
            state: s.state ?? 'unknown',
            port: s.port,
          }))
        }
        if (stack?.resources) {
          context.resources = stack.resources.map((r: any) => ({
            id: r.id ?? r.name,
            kind: r.kind,
            name: r.name,
            state: r.state,
          }))
        }
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Health checks (placeholder for now; would read from health check logs or metrics)
  if (options?.includeHealth && context.services && context.services.length > 0) {
    context.health = context.services.map(s => ({
      service: s.name,
      healthy: s.state === 'running',
      message: s.state === 'running' ? undefined : `Service is ${s.state}`,
    }))
  }
  
  // Errors from logs (scan recent logs for error patterns)
  if (options?.includeErrors) {
    const logsDir = path.join(dataRoot, 'logs')
    if (fs.existsSync(logsDir)) {
      const errorMap: Record<string, { message: string; count: number; timestamp: string }> = {}
      
      for (const svc of context.services ?? []) {
        const logFile = path.join(logsDir, `${svc.name}.log`)
        if (fs.existsSync(logFile)) {
          try {
            const lines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-100) // last 100 lines
            for (const line of lines) {
              if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
                const key = `${svc.name}:${line.slice(0, 100)}`
                if (!errorMap[key]) {
                  errorMap[key] = { message: line.slice(0, 200), count: 1, timestamp: new Date().toISOString() }
                } else {
                  errorMap[key].count++
                }
              }
            }
          } catch {
            // Ignore read errors
          }
        }
      }
      
      context.errors = Object.entries(errorMap)
        .map(([key, val]) => ({
          service: key.split(':')[0],
          message: val.message,
          timestamp: val.timestamp,
          count: val.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }
  }
  
  // Cost estimate (would use sarge-core cost estimator)
  if (options?.includeCost) {
    try {
      const costMod = await import('../cost')
      const usage = {} // Could infer from metrics
      const estimate = costMod.estimate({ kind: 'local', dataRoot, usage })
      context.costEstimate = {
        totalUSD: estimate.totalMonthlyUSD,
        breakdown: {
          s3: estimate.breakdown.s3.storageUSD + estimate.breakdown.s3.requestsUSD,
          dynamo: estimate.breakdown.dynamo.storageUSD + estimate.breakdown.dynamo.requestsUSD,
          lambda: estimate.breakdown.lambda.requestsUSD + estimate.breakdown.lambda.computeUSD,
          sqs: estimate.breakdown.sqs.requestsUSD,
          sns: estimate.breakdown.sns.requestsUSD,
        },
      }
    } catch {
      // Cost module not available
    }
  }
  
  // Last deploy info from deploy history
  if (options?.includeLastDeploy) {
    const deployFile = path.join(dataRoot, 'deploys', `${stackId}.json`)
    if (fs.existsSync(deployFile)) {
      try {
        const deploys = JSON.parse(fs.readFileSync(deployFile, 'utf8')) as any[]
        if (deploys.length > 0) {
          const last = deploys[deploys.length - 1]
          context.lastDeploy = {
            timestamp: last.timestamp ?? last.createdAt,
            changes: last.changes ?? [],
          }
        }
      } catch {
        // Ignore
      }
    }
  }
  
  return context
}
