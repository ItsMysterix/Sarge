"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Rocket, CheckCircle2, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"

export function RealDeployForm() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState("https://github.com/ItsMysterix/Sarge.git")
  const [branch, setBranch] = useState("main")
  const [buildCommand, setBuildCommand] = useState("npm run build")
  const [status, setStatus] = useState<"idle" | "deploying" | "success" | "error">("idle")
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const deployMutation = (trpc as any).deploy.create.useMutation({
    onSuccess: (data: any) => {
      setStatus("success")
      setDeploymentId(data.id)
      setError(null)
      
      // Redirect to deployment page after 1 second
      setTimeout(() => {
        router.push(`/deployments/${data.id}`)
      }, 1000)
    },
    onError: (err: any) => {
      setStatus("error")
      setError(err.message)
    },
  })

  const handleDeploy = async () => {
    setStatus("deploying")
    setError(null)
    
    deployMutation.mutate({
      repoUrl: repoUrl.trim(),
      branch: branch.trim(),
      buildCommand: buildCommand.trim(),
      summary: `Deploy ${repoUrl.split("/").pop()?.replace(".git", "")} @ ${branch}`,
    })
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Deploy from GitHub
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Deploy a real GitHub repository. This will clone the repo, install dependencies, and run the build - showing actual logs!
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="repoUrl" className="text-sm font-medium">
            Repository URL
          </label>
          <input
            id="repoUrl"
            type="text"
            className="w-full px-3 py-2 border rounded-md bg-background"
            placeholder="https://github.com/username/repo.git"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={status === "deploying"}
          />
          <p className="text-xs text-muted-foreground">
            Must be a public GitHub repository (or use git credentials in production)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="branch" className="text-sm font-medium">
              Branch
            </label>
            <input
              id="branch"
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={status === "deploying"}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="buildCommand" className="text-sm font-medium">
              Build Command
            </label>
            <input
              id="buildCommand"
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="npm run build"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
              disabled={status === "deploying"}
            />
          </div>
        </div>

        {status === "success" && (
          <div className="border border-green-500 bg-green-50 dark:bg-green-950 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Deployment started! Redirecting to logs...
            </p>
          </div>
        )}

        {status === "error" && error && (
          <div className="border border-red-500 bg-red-50 dark:bg-red-950 rounded-lg p-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <Button
          onClick={handleDeploy}
          disabled={status === "deploying" || !repoUrl.trim()}
          className="w-full"
        >
          {status === "deploying" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating deployment...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy Now
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>✅ <strong>Real logs:</strong> Git clone output, npm install progress, build errors</p>
          <p>✅ <strong>Live streaming:</strong> Watch logs appear in real-time</p>
          <p>✅ <strong>No mock data:</strong> All output comes from actual commands</p>
        </div>
      </div>
    </div>
  )
}
