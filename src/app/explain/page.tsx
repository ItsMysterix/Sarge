import { Brain } from 'lucide-react'
import { ExplainStackCard } from '@/components/explain/explain-stack-card'
import { AppShell } from '@/components/layout/app-shell'

export default function ExplainPage() {
  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6">
            <p className="text-zinc-400">
              AI-free stack summary generated from local facts. No external LLM calls.
            </p>
          </div>
          
          <ExplainStackCard stackId="default" />
          
          <div className="mt-8 prose prose-invert">
            <h2>Features</h2>
            <ul>
              <li><strong>Topology:</strong> Services and resources overview</li>
              <li><strong>Health:</strong> Service health status</li>
              <li><strong>Errors:</strong> Top errors from logs</li>
              <li><strong>Cost:</strong> Monthly cost estimate</li>
              <li><strong>Recent Changes:</strong> What changed since last deploy</li>
              <li><strong>Links:</strong> Quick navigation to logs, metrics, deployments</li>
            </ul>
            
            <h2>How It Works</h2>
            <p>
              The explanation is generated entirely from local data:
            </p>
            <ul>
              <li>Reads state from <code>dataRoot/state.json</code></li>
              <li>Scans recent logs for error patterns</li>
              <li>Uses cost estimator with static pricing</li>
              <li>Shows deployment history from local files</li>
            </ul>
            <p>
              <strong>No external API calls.</strong> Everything is deterministic and reproducible.
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
