"use client"

import { Brain, Shield, Zap, Mail, Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<"signup" | "verify">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Signup failed")
        return
      }

      setSuccess(data.message)
      setStep("verify")
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Verification failed")
        return
      }

      setSuccess(data.message)
      setTimeout(() => router.push("/sign-in"), 2000)
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleGitHub = async () => {
    try {
      setLoading(true)
      await signIn("github", { callbackUrl: "/" })
    } catch (err) {
      setError("GitHub sign-up failed. Please try again.")
    } finally {
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
          <h1 className="text-2xl font-bold mb-2">Join Command Center</h1>
          <p className="text-gray-400">Create your account to get started</p>
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

        {/* Sign Up Form or Verification */}
        <div className="glass-card p-6 rounded-lg border border-white/10">
          {step === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <User className="w-4 h-4" />
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

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
                onClick={handleGitHub}
                disabled={loading}
                variant="outline"
                className="w-full glass-card border border-white/10 text-white hover:bg-white/10"
              >
                GitHub
              </Button>

              <div className="mt-4 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/sign-in")}
                  className="text-accent hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                <p className="text-gray-400 text-sm">
                  We sent a verification code to <span className="text-accent">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full glass-card border border-white/10 text-white bg-transparent focus:border-accent/50 rounded px-4 py-2 outline-none transition-colors text-center text-2xl tracking-widest"
                  placeholder="123456"
                  required
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center text-sm text-gray-400">
                Didn't receive code?{" "}
                <button
                  type="button"
                  onClick={() => handleSignup(new Event("submit") as any)}
                  className="text-accent hover:underline"
                  disabled={loading}
                >
                  Resend
                </button>
              </div>
            </form>
          )}
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
