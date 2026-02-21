"use client"

import { useRef, useEffect, useMemo } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PROVIDER_COLORS } from "./shared"
import { LogLine } from "./log-line"

export const ProviderLogPane = ({
  providerId, logs, isLive, search, isExpanded, onToggleExpand
}: {
  providerId: string; logs: any[]; isLive: boolean; search: string;
  isExpanded: boolean; onToggleExpand: () => void
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const providerColor = PROVIDER_COLORS[providerId] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'

  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs.length, isLive])

  const filtered = useMemo(() =>
    logs.filter(l =>
      !search || l.message?.toLowerCase().includes(search.toLowerCase())
    ),
    [logs, search]
  )

  return (
    <div className={cn(
      "flex flex-col border border-border rounded-xl bg-card overflow-hidden transition-all",
      isExpanded ? "col-span-full" : ""
    )}>
      {/* Pane header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest", providerColor)}>
            {providerId}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} entries</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-6 w-6 p-0">
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
      </div>

      {/* Log content */}
      <div ref={scrollRef} className={cn("overflow-y-auto", isExpanded ? "max-h-[600px]" : "max-h-[400px]")}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground/50 text-xs font-medium">
            No logs from {providerId}
          </div>
        ) : (
          filtered.map((log: any, i: number) => (
            <LogLine key={log.id || `${providerId}-${i}`} log={log} search={search} showProvider={false} />
          ))
        )}
      </div>
    </div>
  )
}
