"use client"

import { Brain, Shield, Zap } from "lucide-react"
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid credentials")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  const handleGitHub = async () => {
    setLoading(true)
    await signIn("github", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-accent terminal-text">SARGE</div>
            <div className="ml-3 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Command Center</h1>
          <p className="text-gray-400">Secure authentication required</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <Brain className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-xs text-gray-400">AI Insights</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="text-xs text-gray-400">Real-time</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Shield className="w-6 h-6 text-success mx-auto mb-2" />
            <div className="text-xs text-gray-400">Secure</div>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="glass-card p-6 rounded-lg border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors"
                placeholder="dev@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-black font-bold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0f0f0f] text-gray-400">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGitHub}
            disabled={loading}
            variant="outline"
            className="w-full glass-card border border-white/10 text-white hover:bg-white/10"
          >
            GitHub
          </Button>

          <div className="mt-4 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-accent hover:text-accent/80">
              Sign up
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-xs text-gray-500 terminal-text">SARGE v2.0 • Secure DevOps Command Center</div>
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-success">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
