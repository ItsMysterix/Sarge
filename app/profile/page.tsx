"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { User, Mail, Calendar, GitBranch, Activity, Settings, Save, Database, Cloud, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useUser } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { AuthLoading } from "@/components/auth/loading"

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { addToast, ToastContainer } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
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
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <ToastContainer />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Profile</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">
              Manage your account settings and view your activity
            </p>
          </motion.div>

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
                    {user?.imageUrl ? (
                      <img
                        src={user?.imageUrl}
                        alt={user?.fullName || 'User'}
                        className="w-24 h-24 rounded-full border-2 border-accent/30"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
                        <User className="w-12 h-12 text-accent" />
                      </div>
                    )}
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
                    className="glass-card w-full px-4 py-2 text-accent hover:bg-accent/20 transition-all duration-300 rounded-lg border border-accent/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* GitHub Connection */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-accent" />
                  Connected Accounts
                </h3>
                <div className="glass-card p-6 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#24292e] rounded-lg flex items-center justify-center">
                        <GitBranch className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">GitHub</h4>
                        <p className="text-sm text-gray-400">
                          {(user as any)?.externalAccounts?.find((acc: any) => acc.provider === 'oauth_github')
                            ? 'Connected'
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {(user as any)?.externalAccounts?.find((acc: any) => acc.provider === 'oauth_github') ? (
                      <span className="px-3 py-1.5 bg-success/20 text-success text-sm rounded-lg border border-success/30">
                        ✓ Connected
                      </span>
                    ) : (
                      <button className="glass-card px-4 py-2 text-accent hover:bg-accent/20 transition-all duration-300 rounded-lg border border-accent/30">
                        Connect
                      </button>
                    )}
                  </div>
                </div>
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
      </div>
    </div>
  )
}
