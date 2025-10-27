import fs from 'node:fs'
import path from 'node:path'

export interface ServiceTelemetry {
  up: Map<string, number>
  restarts: Map<string, number>
}

export function createTelemetry(): ServiceTelemetry {
  return { up: new Map(), restarts: new Map() }
}

export function markUp(t: ServiceTelemetry, name: string, up: boolean) {
  t.up.set(name, up ? 1 : 0)
}

export function markRestart(t: ServiceTelemetry, name: string) {
  const cur = t.restarts.get(name) || 0
  t.restarts.set(name, cur + 1)
}

export function renderPrometheus(t: ServiceTelemetry): string {
  const lines: string[] = []
  for (const [name, v] of t.up) lines.push(`sarge_service_up{service="${name}"} ${v}`)
  for (const [name, v] of t.restarts) lines.push(`sarge_service_restarts_total{service="${name}"} ${v}`)
  return lines.join('\n') + (lines.length ? '\n' : '')
}

export function ensureDashboards(dataRoot: string) {
  const dir = path.join(dataRoot, 'dashboards')
  fs.mkdirSync(dir, { recursive: true })
  const dashboards = [
    { file: 'workspace-health.json', title: 'Workspace Health' },
    { file: 'stack-overview.json', title: 'Stack Overview' },
    { file: 'service-drilldown.json', title: 'Service Drill-down' }
  ]
  for (const d of dashboards) {
    const p = path.join(dir, d.file)
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify({ title: d.title, panels: [] }, null, 2))
    }
  }
}
