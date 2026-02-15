"use client"

import { AppShell } from "@/components/layout/app-shell"
import { User, Mail, Calendar, GitBranch, Activity, Settings, Save, Database, Cloud, Zap, Lock, Key, Github, Terminal, Copy, Plus, Trash2, Shield, Clock, Loader2, CheckCircle, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useUser } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { AuthLoading } from "@/components/auth/loading"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { data: session } = useSession()
  const { addToast, ToastContainer } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubConnection, setGithubConnection] = useState<{ connected: boolean; source?: string } | null>(null)
  
  // Security settings state
  const [showSecuritySettings, setShowSecuritySettings] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Fetch user stats
  const t = trpc as any
  const stacksQuery = t.stacks?.list?.useQuery()
  const awsSummaryQuery = t.aws?.getSummary?.useQuery()
  
  // PATs logic
  const tokensQuery = t.tokens?.list?.useQuery()
  const createTokenMutation = t.tokens?.create?.useMutation({
    onSuccess: (data: any) => {
      setNewToken(data.token)
      tokensQuery.refetch()
      addToast({ type: "success", title: "Token created", description: "Copy it now, you won't see it again!" })
    }
  })
  const revokeTokenMutation = t.tokens?.revoke?.useMutation({
    onSuccess: () => {
      tokensQuery.refetch()
      addToast({ type: "success", title: "Token revoked" })
    }
  })

  const [newToken, setNewToken] = useState<string | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [isCreatingToken, setIsCreatingToken] = useState(false)

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName)
    }
  }, [user])

  if (!isLoaded || !isSignedIn) {
    return <AuthLoading />
  }

  const isGitHubUser = session?.user && (session as any).accessToken
  const isCredentialsUser = !isGitHubUser
  const isGitHubConnected = Boolean(isGitHubUser || githubConnection?.connected)

  useEffect(() => {
    if (!isSignedIn) return
    const loadGithubConnection = async () => {
      try {
        const response = await fetch("/api/github/connection")
        if (!response.ok) return
        const data = await response.json()
        setGithubConnection(data)
      } catch (err) {
        console.error('Failed to load GitHub connection:', err)
      }
    }
    loadGithubConnection()
  }, [isSignedIn])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Profile Updated',
          description: 'Your profile has been saved successfully',
        })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match',
      })
      return
    }

    if (newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Weak Password',
        description: 'Password must be at least 8 characters long',
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Password Changed',
          description: 'Your password has been updated successfully',
        })
        setShowSecuritySettings(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Password Change Failed',
        description: error instanceof Error ? error.message : 'Failed to change password',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const stats = [
    {
      label: 'Stacks Created',
      value: stacksQuery.data?.length || 0,
      icon: Database,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'S3 Buckets',
      value: awsSummaryQuery.data?.s3?.bucketCount || 0,
      icon: Cloud,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Lambda Functions',
      value: awsSummaryQuery.data?.lambda?.functionCount || 0,
      icon: Zap,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'DynamoDB Tables',
      value: awsSummaryQuery.data?.dynamodb?.tableCount || 0,
      icon: Database,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ]

  return (
    <AppShell>
      <ToastContainer />
      <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="glass-card p-6 border border-white/10 rounded-lg">
                <div className="flex flex-col items-center">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    {/* Hide photo on Profile page per request; show simple avatar icon only */}
                    <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
                      <User className="w-12 h-12 text-accent" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-success rounded-full border-2 border-[#0f0f0f]" />
                  </div>

                  {/* Name */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xl font-bold text-center bg-white/5 border border-accent/30 rounded px-3 py-2 mb-2 text-white focus:outline-none focus:border-accent"
                      placeholder="Your name"
                    />
                  ) : (
                    <h2 className="text-xl font-bold mb-1">{user?.fullName ?? 'Developer'}</h2>
                  )}

                  {/* Email */}
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.emailAddresses?.[0]?.emailAddress}</span>
                  </div>

                  {/* Edit/Save Button */}
                  <button
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    disabled={isSaving}
                    className="w-full px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </button>

                  {isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setName(user?.fullName ?? '')
                      }}
                      className="w-full mt-2 px-4 py-2 text-gray-400 hover:text-white transition-all duration-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Account Info */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined
                    </span>
                    <span className="font-medium">
                      {user && 'createdAt' in user && (user as any).createdAt
                        ? new Date((user as any).createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Status
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="font-medium text-success">Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats and Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Your Activity
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                      className="glass-card p-4 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
                    >
                      <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* GitHub Connection & Security */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-accent" />
                  Security & Connections
                </h3>
                
                {/* GitHub Connection Status */}
                <div className="glass-card p-6 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#24292e] rounded-lg flex items-center justify-center">
                        <Github className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">GitHub</h4>
                        <p className="text-sm text-gray-400">
                          {isGitHubConnected
                            ? (isGitHubUser ? 'Connected - OAuth Active' : 'Connected - OAuth Linked')
                            : 'Connect GitHub to access private repos'}
                        </p>
                      </div>
                    </div>
                    {isGitHubConnected ? (
                      <span className="px-3 py-1.5 bg-success/20 text-success text-sm rounded-lg border border-success/30 flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowGithubModal(true)}
                        className="px-4 py-2 text-accent bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg border border-accent/30 backdrop-blur-sm flex items-center gap-2"
                      >
                        <Github className="w-4 h-4" />
                        Connect GitHub
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Change (only for credentials users) */}
                {isCredentialsUser && (
                  <div className="glass-card p-6 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-accent" />
                        <div>
                          <h4 className="font-semibold">Change Password</h4>
                          <p className="text-sm text-gray-400">Update your account password</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSecuritySettings(!showSecuritySettings)}
                        className="text-sm text-accent hover:underline"
                      >
                        {showSecuritySettings ? 'Cancel' : 'Change'}
                      </button>
                    </div>

                    {showSecuritySettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-4 border-t border-white/10"
                      >
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                            placeholder="Enter new password (min 8 characters)"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                          className="w-full px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                        >
                          {isChangingPassword ? 'Changing Password...' : 'Update Password'}
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Personal Access Tokens */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    Personal Access Tokens
                  </h3>
                  <button
                    onClick={() => setIsCreatingToken(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10"
                  >
                    <Plus className="w-3 h-3" />
                    Generate New
                  </button>
                </div>

                {isCreatingToken && (
                  <div className="glass-card p-4 border border-accent/20 bg-accent/5 rounded-lg space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Token Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                          placeholder="e.g. MacBook Pro CLI"
                          className="flex-1 bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => {
                            createTokenMutation.mutate({ name: tokenName })
                            setTokenName("")
                            setIsCreatingToken(false)
                          }}
                          disabled={!tokenName || createTokenMutation.isLoading}
                          className="bg-accent text-black px-4 py-1.5 rounded font-medium text-sm disabled:opacity-50"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {newToken && (
                  <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg space-y-2">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Success! Token generated
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/40 border border-emerald-500/20 p-2 rounded text-emerald-300 font-mono text-xs break-all">
                        {newToken}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newToken)
                          addToast({ type: "info", title: "Copied", description: "Token copied to clipboard" })
                        }}
                        className="p-2 hover:bg-white/5 rounded"
                      >
                        <Copy className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-400/60">
                      Store this safely. It will not be shown again.
                    </p>
                  </div>
                )}

                <div className="glass-card border border-white/10 rounded-lg divide-y divide-white/10">
                  {tokensQuery.data?.map((token: any) => (
                    <div key={token.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                          <Key className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{token.name}</h4>
                          <p className="text-[10px] text-gray-500 font-mono">
                            Created {new Date(token.created_at).toLocaleDateString()} · 
                            Last used {token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => revokeTokenMutation.mutate({ tokenId: token.id })}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!tokensQuery.data || tokensQuery.data.length === 0) && !isCreatingToken && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      No active tokens
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Developer Portal / CLI Setup */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-accent" />
                  Developer Portal
                </h3>
                <div className="glass-card p-6 border border-white/10 rounded-lg bg-gradient-to-br from-accent/5 to-transparent">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">1</span>
                          <span className="text-sm font-medium">Install Sarge CLI</span>
                        </div>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">v1.2.4</span>
                      </div>
                      <div className="relative group">
                        <pre className="bg-black/40 border border-white/10 p-3 rounded font-mono text-xs text-accent overflow-x-auto">
                          curl -sL https://cli.sarge.io/install | sh
                        </pre>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("curl -sL https://cli.sarge.io/install | sh")
                            addToast({ type: "info", title: "Copied", description: "Command copied" })
                          }}
                          className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 bg-white/5 rounded transition-opacity"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">2</span>
                        <span className="text-sm font-medium">Authenticate</span>
                      </div>
                      <div className="relative group">
                        <pre className="bg-black/40 border border-white/10 p-3 rounded font-mono text-xs text-accent overflow-x-auto">
                          sarge login --token {'<YOUR_TOKEN>'}
                        </pre>
                        <p className="mt-2 text-[10px] text-gray-500">
                          Or run <code className="text-accent/60">sarge login</code> to authenticate via browser.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <ExternalLink className="w-3 h-3" />
                        Explore CLI Documentation
                      </div>
                      <div className="flex items-center gap-3">
                        <Github className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                        <span className="text-xs text-accent hover:underline cursor-pointer">View Samples</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sessions & History */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-4 pb-10"
              >
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Active Sessions
                </h3>
                <div className="glass-card border border-white/10 rounded-lg divide-y divide-white/10">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Current Session (Chrome / macOS)</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active Now</span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Started 2 hours ago
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">192.168.1.1</div>
                  </div>
                  <div className="p-4 flex items-center justify-between opacity-60 grayscale">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-400">CLI session (MacBook Pro)</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last seen yesterday
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300">Revoke</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
      </main>
      {/* GitHub Connect Modal */}
      {!isGitHubConnected && showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* glass overlay (not fully dimmed) */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowGithubModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative glass-card w-full max-w-md border border-white/10 rounded-xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                  <Github className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect GitHub</h2>
                  <p className="text-xs text-gray-400">Authorize GitHub to enable repository imports</p>
                </div>
              </div>
              <button
                onClick={() => setShowGithubModal(false)}
                className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                We use GitHub OAuth only to read your repository metadata (name, branches) and enable optional automated analysis.
                No code is stored. You can revoke access anytime from your GitHub settings.
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-full" /> List repositories</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-full" /> Detect framework & build hints</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-accent rounded-full" /> Enable one-click deploy flows</li>
              </ul>
            </div>
            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20 backdrop-blur-sm">
              <button
                onClick={() => setShowGithubModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <a
                href="/api/auth/signin/github?callbackUrl=/profile?github=connected"
                className="px-5 py-2 text-sm font-medium bg-accent text-black rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Github className="w-4 h-4" /> Continue with GitHub
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  )
}
