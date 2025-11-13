"use client"

import { AppShell } from "@/components/layout/app-shell"
import { PageTitle } from "@/components/layout/page-title"
import { User, Mail, Calendar, GitBranch, Activity, Settings, Save, Database, Cloud, Zap, Lock, Key, Github } from "lucide-react"
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
      <PageTitle
        title="Profile"
        description="Manage account profile and credentials"
        icon={<User className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
      />
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
                          {isGitHubUser ? 'Connected - OAuth Active' : 'Sign in with GitHub to connect'}
                        </p>
                      </div>
                    </div>
                    {isGitHubUser ? (
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

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Recent Activity
                </h3>
                <div className="glass-card border border-white/10 rounded-lg divide-y divide-white/10">
                  {stacksQuery.data?.slice(0, 5).map((stack: any, idx: number) => (
                    <div key={stack.id} className="p-4 hover:bg-white/5 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium">{stack.name}</h4>
                            <p className="text-xs text-gray-400">
                              {stack.services?.length || 0} services · {stack.status}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(stack.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!stacksQuery.data || stacksQuery.data.length === 0) && (
                    <div className="p-8 text-center text-gray-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
      </main>
      {/* GitHub Connect Modal */}
      {!isGitHubUser && showGithubModal && (
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
                href="/api/auth/signin?callbackUrl=/profile"
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
