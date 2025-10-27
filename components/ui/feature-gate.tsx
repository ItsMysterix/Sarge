"use client"

import { PropsWithChildren } from 'react'
import { useLicense } from '@/hooks/useLicense'

export function FeatureGate(props: PropsWithChildren<{ feature: 'cloudApply' | 'teamSpaces'; title?: string }>) {
  const { status, isLoading } = useLicense()
  const enabled = status?.features?.[props.feature] || status?.inGrace
  if (isLoading) return <div className="rounded border border-border bg-muted/30 p-3 text-xs text-muted-foreground">Checking license…</div>
  if (!enabled) {
    return (
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4">
        <div className="mb-1 text-sm font-semibold">{props.title ?? 'Feature locked'}</div>
        <p className="text-xs text-muted-foreground">
          This feature requires a license. Run offline with a local license file in <span className="font-mono">data/sarge/license.json</span>.
        </p>
        {status?.messages?.length ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {status.messages.map((m, i) => (<li key={i}>{m}</li>))}
          </ul>
        ) : null}
      </div>
    )
  }
  return <>{props.children}</>
}
