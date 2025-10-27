import type { Service } from './types'

export function resolveStartOrder(services: Service[]): string[] {
  // Kahn's algorithm for deterministic topological sort
  const deps = new Map<string, Set<string>>()
  const rdeps = new Map<string, Set<string>>()

  for (const s of services) {
    deps.set(s.id, new Set(s.dependsOn ?? []))
    for (const d of s.dependsOn ?? []) {
      if (!rdeps.has(d)) rdeps.set(d, new Set())
      rdeps.get(d)!.add(s.id)
    }
    if (!rdeps.has(s.id)) rdeps.set(s.id, new Set())
  }

  const ready = Array.from(deps.entries())
    .filter(([, d]) => d.size === 0)
    .map(([id]) => id)
    .sort() // deterministic

  const order: string[] = []
  const queue: string[] = [...ready]

  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const child of rdeps.get(id) ?? []) {
      const d = deps.get(child)
      if (!d) continue
      d.delete(id)
      if (d.size === 0) {
        // insert deterministically
        const idx = queue.findIndex((x) => x > child)
        if (idx === -1) queue.push(child)
        else queue.splice(idx, 0, child)
      }
    }
  }

  const remaining = Array.from(deps.values()).some((d) => d.size > 0)
  if (remaining) throw new Error('Cycle detected in service dependencies')
  return order
}
