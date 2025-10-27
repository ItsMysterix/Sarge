declare module 'prom-client' {
  export class Registry {
    contentType: string
    metrics(): Promise<string>
  }
  export function collectDefaultMetrics(opts: { register: Registry }): void
  export class Counter<L extends string = string> {
    constructor(opts: { name: string; help: string; labelNames?: readonly L[]; registers?: Registry[] })
    inc(labels?: Record<L, string>, value?: number): void
  }
  export class Gauge<L extends string = string> {
    constructor(opts: { name: string; help: string; labelNames?: readonly L[]; registers?: Registry[] })
    set(value: number): void
    set(labels: Record<L, string>, value: number): void
  }
  export class Histogram<L extends string = string> {
    constructor(opts: { name: string; help: string; labelNames?: readonly L[]; buckets?: number[]; registers?: Registry[] })
    startTimer(labels?: Record<L, string>): () => void
    observe(labels: Record<L, string>, value: number): void
  }
}
