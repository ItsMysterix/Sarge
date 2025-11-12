import { Metadata } from "next"
import Link from "next/link"
import { RealDeployForm } from "@/components/deploy/real-deploy-form"
import { PageTitle } from "@/components/layout/page-title"
import { FlaskConical } from "lucide-react"

export const metadata: Metadata = {
  title: "Test Real Deployment | Sarge",
  description: "Test real GitHub repository deployment with live logs",
}

export default function TestDeployPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <PageTitle
          title="Test Deploy"
          description="Create and validate test deployment"
          icon={<FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Real Deployment</h1>
          <p className="text-muted-foreground mt-2">
            Deploy a GitHub repository and see <strong>real</strong> logs from git clone, npm install, and build process.
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            🚨 This is a TEST page for real deployment
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>✅ Clones actual GitHub repositories</li>
            <li>✅ Runs npm/pnpm/yarn install with real output</li>
            <li>✅ Executes build commands and captures errors</li>
            <li>✅ Streams logs to deployment_logs table</li>
            <li>❌ No more mock data!</li>
          </ul>
        </div>

        <RealDeployForm />

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="font-mono bg-muted px-2 py-1 rounded">1</div>
              <div>
                <strong>Clone:</strong> Uses <code className="bg-muted px-1 rounded">git clone --depth=1</code> to fetch the repository
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono bg-muted px-2 py-1 rounded">2</div>
              <div>
                <strong>Setup:</strong> Detects package manager (npm/pnpm/yarn) and Node.js version
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono bg-muted px-2 py-1 rounded">3</div>
              <div>
                <strong>Install:</strong> Runs package manager install and captures all output
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono bg-muted px-2 py-1 rounded">4</div>
              <div>
                <strong>Build:</strong> Executes your build command (e.g., <code className="bg-muted px-1 rounded">npm run build</code>)
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono bg-muted px-2 py-1 rounded">5</div>
              <div>
                <strong>Deploy:</strong> (Mock for now) Would upload to CDN/edge network
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link 
            href="/deployments" 
            className="text-sm text-primary hover:underline"
          >
            ← View all deployments
          </Link>
          <Link 
            href="/oneclick" 
            className="text-sm text-primary hover:underline"
          >
            Try one-click deploy →
          </Link>
        </div>
      </div>
    </div>
  )
}
