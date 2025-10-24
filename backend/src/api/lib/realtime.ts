import { observable } from '@trpc/server/observable'
import { ee as defaultEmitter } from './events'
import type { EventEmitter } from 'events'

export type Emitter = EventEmitter

type BufferOptions = {
  bufferSize?: number
  perTickCap?: number // max items to emit per event loop tick
  topics?: string[] // topics to listen on when using a custom emitter
  predicate?: (event: any) => boolean // optional pre-buffer filter
}

/**
 * Create a tRPC subscription handler that listens to an EventEmitter event and
 * delivers items to the subscriber using a bounded in-memory buffer. When the
 * buffer is full the oldest item is dropped (drop-oldest policy).
 *
 * Usage in a router:
 *   live: t.procedure.subscription(() => createBufferedSubscription('metric', { bufferSize: 100 }))
 */
export function createBufferedSubscription<T = any>(eventOrEmitter: string | string[] | Emitter, opts: BufferOptions = {}) {
  const bufferSize = opts.bufferSize ?? 100
  const perTickCap = opts.perTickCap ?? 100

  return () =>
    observable<T>((emit) => {
      const queue: T[] = []
      let closed = false
      let scheduled = false

      // Resolve emitter and topics based on arguments; keep backward compatibility
      let emitter: Emitter
      let topics: string[]
      if (typeof eventOrEmitter === 'string' || Array.isArray(eventOrEmitter)) {
        emitter = defaultEmitter
        topics = Array.isArray(eventOrEmitter) ? eventOrEmitter : [eventOrEmitter]
      } else {
        emitter = eventOrEmitter
        topics = opts.topics && opts.topics.length ? opts.topics : []
      }
      if (!topics || topics.length === 0) {
        throw new Error('createBufferedSubscription requires at least one topic')
      }

      function tryFlush() {
        scheduled = false
        // Emit up to perTickCap items per tick to avoid long synchronous stalls
        let processed = 0
        while (!closed && queue.length > 0 && processed < perTickCap) {
          const item = queue.shift()!
          try {
            emit.next(item)
          } catch (err) {
            console.error('Error emitting subscription item:', err)
            break
          }
          processed += 1
        }
        // If backlog remains, schedule next flush on a new tick
        if (!closed && queue.length > 0) {
          scheduled = true
          setImmediate(tryFlush)
        }
      }

      const handler = (data: T) => {
        if (opts.predicate && !opts.predicate(data)) return
        queue.push(data)
        if (queue.length > bufferSize) {
          // Drop oldest to keep memory bounded
          queue.shift()
        }

        // Schedule a flush if one isn't already queued up
        if (!scheduled) {
          scheduled = true
          setImmediate(tryFlush)
        }
      }

      // Register on all topics
      for (const t of topics) {
        emitter.on(t, handler)
      }

      return () => {
        closed = true
        for (const t of topics) {
          emitter.off(t, handler)
        }
      }
    })
}

export default createBufferedSubscription
