"use client"

import { Shield, Zap, Layers } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("verify")) {
          setError("Please verify your email before signing in. Check your inbox for the verification code.")
        } else if (result.error.includes("credentials")) {
          setError("Invalid email or password. Please try again.")
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        router.push("/projects")
      }
    } catch (err) {
      setError("Connection error. Please check your internet and try again.")
      setLoading(false)
    }
  }

  const handleGitHub = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await signIn("github", { callbackUrl: "/" })
      if (result?.error) {
        setError(`GitHub sign-in failed: ${result.error}`)
        setLoading(false)
      }
    } catch (err) {
      setError("GitHub sign-in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between border-r border-border bg-card p-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold tracking-tight">SARGE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">DevOps Command Center</p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">One-Click Deploy</p>
              <p className="text-xs text-muted-foreground mt-0.5">Deploy to Vercel, Render, Railway, AWS, and more — instantly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Full Stack Management</p>
              <p className="text-xs text-muted-foreground mt-0.5">Infrastructure as code, secrets, pipelines, and environments — unified.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Governance & Compliance</p>
              <p className="text-xs text-muted-foreground mt-0.5">Audit trails, cost tracking, drift detection — automatic.</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sarge. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tracking-tight">SARGE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your account to continue</p>

          {/* GitHub */}
          <Button
            type="button"
            onClick={handleGitHub}
            disabled={loading}
            variant="outline"
            className="w-full h-11 border-border text-foreground hover:bg-card"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {loading ? "Connecting..." : "Continue with GitHub"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don&apos;t have an account?{" "}
            <a href="/sign-up" className="text-foreground hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
