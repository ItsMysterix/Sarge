"use client"

import React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PROVIDER_COLORS, LEVEL_STYLES } from "./shared"
import { ExternalLink } from "lucide-react"

/**
 * Smart severity classifier — infers severity from message content
 * when the provider doesn't explicitly set it.
 */
function inferSeverity(log: any): string {
  // Use explicit severity if set
  if (log.severity) return log.severity

  const level = log.level || ''
  if (level === 'fatal' || level === 'critical') return 'critical'
  if (level === 'error') return 'high'
  if (level === 'warn' || level === 'warning') return 'medium'

  // Pattern-match on message content
  const msg = (log.message || '').toLowerCase()
  if (msg.includes('oom') || msg.includes('out of memory') || msg.includes('crash') || msg.includes('fatal') || msg.includes('segfault')) return 'critical'
  if (msg.includes('timeout') || msg.includes('connection refused') || msg.includes('econnrefused') || msg.includes('500') || msg.includes('502') || msg.includes('503')) return 'high'
  if (msg.includes('deprecated') || msg.includes('warning') || msg.includes('retry') || msg.includes('slow query') || msg.includes('429')) return 'medium'
  if (msg.includes('404') || msg.includes('not found')) return 'low'

  // HTTP status code
  if (log.statusCode >= 500) return 'high'
  if (log.statusCode >= 400) return 'medium'

  return 'info'
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'text-red-500 bg-red-500/15 border-red-500/30 animate-pulse',
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-blue-400 bg-blue-500/10',
  info: 'text-zinc-400 bg-zinc-500/10',
}

const CATEGORY_ICONS: Record<string, string> = {
  error: '🐛',
  security: '🛡️',
  billing: '💳',
  deploy: '🚀',
  build: '🔨',
  http: '🌐',
  db: '🗄️',
  auth: '🔑',
  audit: '📋',
  event: '⚡',
}

export const LogLine = ({ log, search, showProvider = true, compact = false }: {
  log: any; search: string; showProvider?: boolean; compact?: boolean
}) => {
  const level = log.level || log.type || 'info'
  const severity = inferSeverity(log)
  const levelStyle = SEVERITY_STYLES[severity] || LEVEL_STYLES[level] || LEVEL_STYLES.info
  const providerColor = PROVIDER_COLORS[log.provider] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  const ts = log.timestamp || log.created_at || log.createdAt
  const categoryIcon = CATEGORY_ICONS[log.category] || ''

  const highlightMessage = (msg: string) => {
    if (!search || !msg) return msg
    const idx = msg.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return msg
    return (
      <>
        {msg.slice(0, idx)}
        <mark className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{msg.slice(idx, idx + search.length)}</mark>
        {msg.slice(idx + search.length)}
      </>
    )
  }

  return (
    <div className={cn(
      "group flex items-start gap-2 px-4 py-2 hover:bg-muted/10 transition-colors font-mono text-[11px] border-b border-border/30 last:border-0",
      severity === 'critical' && "bg-red-500/5 border-l-2 border-l-red-500",
      severity === 'high' && "bg-red-500/[0.02] border-l-2 border-l-red-400/50",
    )}>
      {/* Timestamp */}
      <span className="text-muted-foreground/60 shrink-0 tabular-nums w-[72px]">
        {ts ? format(new Date(ts), "HH:mm:ss") : "--:--:--"}
      </span>

      {/* Severity badge */}
      <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", levelStyle)}>
        {severity === 'info' ? level.slice(0, 4) : severity.slice(0, 4)}
      </span>

      {/* Provider badge */}
      {showProvider && log.provider && (
        <span className={cn("shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider", providerColor)}>
          {log.provider}
        </span>
      )}

      {/* Category icon */}
      {categoryIcon && !compact && (
        <span className="shrink-0 text-[10px]" title={log.category}>{categoryIcon}</span>
      )}

      {/* Service / source */}
      {(log.service || log.source) && !compact && (
        <span className="shrink-0 text-indigo-400/70 text-[10px] font-medium truncate max-w-[100px]" title={log.source}>
          {log.service || log.source}
        </span>
      )}

      {/* Message */}
      <span className="text-foreground/85 break-all flex-1 leading-relaxed">
        {highlightMessage(log.message || '')}
      </span>

      {/* Metadata badges */}
      {!compact && (
        <div className="flex items-center gap-1.5 shrink-0">
          {/* HTTP details */}
          {log.method && (
            <span className="text-muted-foreground/50 text-[10px]">
              {log.method} {log.path} {log.statusCode && (
                <span className={log.statusCode >= 500 ? 'text-red-400' : log.statusCode >= 400 ? 'text-amber-400' : 'text-emerald-400'}>
                  {log.statusCode}
                </span>
              )}
            </span>
          )}

          {/* Duration */}
          {log.duration && (
            <span className={cn("text-[10px]", log.duration > 5000 ? 'text-red-400' : log.duration > 1000 ? 'text-amber-400' : 'text-muted-foreground/40')}>
              {log.duration}ms
            </span>
          )}

          {/* User count (Sentry) */}
          {log.metadata?.userCount && (
            <span className="text-[10px] text-muted-foreground/50" title="Users affected">
              👤 {log.metadata.userCount}
            </span>
          )}

          {/* Event count */}
          {log.metadata?.count && log.metadata.count > 1 && (
            <span className="text-[10px] text-muted-foreground/50 bg-muted/30 px-1 rounded" title="Occurrences">
              ×{log.metadata.count}
            </span>
          )}

          {/* Amount (Stripe) */}
          {log.metadata?.amount && (
            <span className="text-[10px] text-emerald-400 font-medium">
              ${log.metadata.amount.toFixed(2)}
            </span>
          )}

          {/* External link */}
          {log.url && (
            <a href={log.url} target="_blank" rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-foreground">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
