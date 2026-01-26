"use client"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageTitle } from "@/components/layout/page-title"
import { Activity, ScrollText, Gauge, ExternalLink } from "lucide-react"

export default function ObservabilityHub() {
  return (
    <AppShell>
      <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-[100vw]">
        <PageTitle
          title="Observability"
          description="Metrics and logs in one place"
          icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="glass-card border border-white/10 rounded-lg p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <div>
                <h2 className="text-lg font-semibold">Metrics</h2>
                <p className="text-sm text-gray-400">Performance, infra, and service health.</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              View CPU, memory, latency, and service-level signals. Switch time ranges and tabs without leaving this hub.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/metrics"
                className="px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center"
              >
                Open Metrics
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
              <span className="text-xs text-gray-400">Live refresh enabled</span>
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-lg p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <div>
                <h2 className="text-lg font-semibold">Logs</h2>
                <p className="text-sm text-gray-400">Streaming, filters, bookmarks, export.</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Tail structured logs across services, pause/resume the stream, filter by level, and export JSON/CSV for incidents.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/logs"
                className="px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center"
              >
                Open Logs
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
              <span className="text-xs text-gray-400">5s live polling by default</span>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
