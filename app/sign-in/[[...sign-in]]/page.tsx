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

  console.log('🔵 SignInPage rendered, loading:', loading)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 Email sign-in started:', email)
    setLoading(true)
    setError("")

    try {
      console.log('🔵 Calling signIn("credentials")...')
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log('🔵 Credentials signIn result:', result)

      if (result?.error) {
        console.error('❌ Sign-in error:', result.error)
        // Parse detailed error messages
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
        console.log('✅ Sign-in successful, redirecting to projects...')
        router.push("/projects")
      }
    } catch (err) {
      console.error('❌ Unexpected error during sign-in:', err)
      setError("Connection error. Please check your internet and try again.")
      setLoading(false)
    }
  }

  const handleGitHub = async () => {
    console.log('🔵 GitHub button clicked')
    console.log('🔵 Current loading state:', loading)
    console.log('🔵 signIn function available:', typeof signIn)
    
    setLoading(true)
    setError("")
    
    try {
      console.log('🔵 Calling signIn("github") with callback: /')
      const result = await signIn("github", { callbackUrl: "/" })
    import { PageTitle } from '@/components/layout/page-title';
      console.log('🔵 signIn result:', result)
      
      if (result?.error) {
        console.error('❌ GitHub OAuth error:', result.error)
        setError(`GitHub sign-in failed: ${result.error}`)
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ GitHub sign-in exception:', err)
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack')
      setError("GitHub sign-in failed. Please try again.")
      setLoading(false)
    }
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
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}
            
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
            type="button"
            onClick={() => {
              console.log('🔵 Button onClick fired')
              handleGitHub()
            }}
            disabled={loading}
            variant="outline"
            className="w-full glass-card border border-white/10 text-white hover:bg-white/10"
          >
            {loading ? 'Loading...' : 'GitHub'}
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
