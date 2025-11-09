"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Cloud, Database, Zap, Shield, Activity, Plus, Trash2, Eye } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc"

export default function AWSEmulationPage() {
  const [activeTab, setActiveTab] = useState("s3")
  const [showEmptyStates, setShowEmptyStates] = useState(false)

  const t = trpc as any
  const summaryQuery = t.aws.getSummary.useQuery()
  const s3Query = t.aws.s3.listBuckets.useQuery()
  const dynamoQuery = t.aws.dynamodb.listTables.useQuery()
  const lambdaQuery = t.aws.lambda.listFunctions.useQuery()
  const iamQuery = t.aws.iam.listRoles.useQuery()
  const cwQuery = t.aws.cloudwatch.listLogGroups.useQuery()

  // Show empty states after 2 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEmptyStates(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const services = [
    { 
      id: "s3", 
      name: "S3", 
      icon: Database, 
      description: "Object storage—buckets, objects, versioning",
      count: summaryQuery.data?.s3?.bucketCount || 0,
      detail: `${formatBytes(summaryQuery.data?.s3?.totalSizeBytes || 0)} total`
    },
    { 
      id: "dynamo", 
      name: "DynamoDB", 
      icon: Database, 
      description: "NoSQL tables with key-value & document models",
      count: summaryQuery.data?.dynamodb?.tableCount || 0,
      detail: `${summaryQuery.data?.dynamodb?.totalItems || 0} items`
    },
    { 
      id: "lambda", 
      name: "Lambda", 
      icon: Zap, 
      description: "Run functions locally—invoke, logs, cold starts",
      count: summaryQuery.data?.lambda?.functionCount || 0,
      detail: `${summaryQuery.data?.lambda?.invocationsLast24h || 0} invocations (24h)`
    },
    { 
      id: "iam", 
      name: "IAM", 
      icon: Shield, 
      description: "Policy evaluation—deny-by-default access control",
      count: summaryQuery.data?.iam?.roleCount || 0,
      detail: "Roles & policies"
    },
    { 
      id: "cloudwatch", 
      name: "CloudWatch", 
      icon: Activity, 
      description: "Logs & metrics sink for all services",
      count: summaryQuery.data?.cloudwatch?.logGroupCount || 0,
      detail: "Log groups"
    },
  ]

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
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
              <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">AWS Emulation</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">
              AWS-compatible services running offline—no internet, no credentials, fully deterministic
            </p>
          </motion.div>

          {/* Tabs for AWS Services */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-card border border-white/10 p-1 mb-6 flex-wrap h-auto">
              {services.map((svc) => (
                <TabsTrigger
                  key={svc.id}
                  value={svc.id}
                  className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:border-accent/30 flex items-center gap-2 px-3 sm:px-4 py-2"
                >
                  <svc.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{svc.name}</span>
                  <span className="sm:hidden">{svc.id.toUpperCase()}</span>
                  <span className="ml-1 text-xs bg-accent/20 px-1.5 py-0.5 rounded">{svc.count}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* S3 Tab */}
            <TabsContent value="s3">
              <S3Content buckets={s3Query.data || []} loading={s3Query.isLoading && !showEmptyStates} />
            </TabsContent>

            {/* DynamoDB Tab */}
            <TabsContent value="dynamo">
              <DynamoDBContent tables={dynamoQuery.data || []} loading={dynamoQuery.isLoading && !showEmptyStates} />
            </TabsContent>

            {/* Lambda Tab */}
            <TabsContent value="lambda">
              <LambdaContent functions={lambdaQuery.data || []} loading={lambdaQuery.isLoading && !showEmptyStates} />
            </TabsContent>

            {/* IAM Tab */}
            <TabsContent value="iam">
              <IAMContent roles={iamQuery.data || []} loading={iamQuery.isLoading && !showEmptyStates} />
            </TabsContent>

            {/* CloudWatch Tab */}
            <TabsContent value="cloudwatch">
              <CloudWatchContent logGroups={cwQuery.data || []} loading={cwQuery.isLoading && !showEmptyStates} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

// Helper Components
function S3Content({ buckets, loading }: { buckets: any[], loading: boolean }) {
  if (loading) {
    return <LoadingState service="S3 Buckets" />
  }

  if (buckets.length === 0) {
    return <EmptyState service="S3" icon={Database} description="No buckets created yet" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {buckets.map((bucket: any, idx: number) => (
        <motion.div
          key={bucket.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-white">{bucket.name}</h3>
            </div>
            <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">{bucket.region}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Objects:</span>
              <span className="font-medium">{bucket.object_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="font-medium">{formatBytes(bucket.size_bytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Versioning:</span>
              <span className="font-medium">{bucket.versioning_enabled ? '✓ Enabled' : '✗ Disabled'}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            Created {new Date(bucket.created_at).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function DynamoDBContent({ tables, loading }: { tables: any[], loading: boolean }) {
  if (loading) {
    return <LoadingState service="DynamoDB Tables" />
  }

  if (tables.length === 0) {
    return <EmptyState service="DynamoDB" icon={Database} description="No tables created yet" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table: any, idx: number) => (
        <motion.div
          key={table.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-warning" />
              <h3 className="font-bold text-white">{table.name}</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              table.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'
            }`}>{table.status}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Partition Key:</span>
              <code className="text-xs bg-black/30 px-2 py-0.5 rounded">{table.partition_key} ({table.partition_key_type})</code>
            </div>
            {table.sort_key && (
              <div className="flex justify-between">
                <span className="text-gray-400">Sort Key:</span>
                <code className="text-xs bg-black/30 px-2 py-0.5 rounded">{table.sort_key} ({table.sort_key_type})</code>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Items:</span>
              <span className="font-medium">{table.item_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="font-medium">{formatBytes(table.size_bytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RCU / WCU:</span>
              <span className="font-medium">{table.read_capacity_units} / {table.write_capacity_units}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            Created {new Date(table.created_at).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function LambdaContent({ functions, loading }: { functions: any[], loading: boolean }) {
  if (loading) {
    return <LoadingState service="Lambda Functions" />
  }

  if (functions.length === 0) {
    return <EmptyState service="Lambda" icon={Zap} description="No functions created yet" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {functions.map((func: any, idx: number) => (
        <motion.div
          key={func.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <h3 className="font-bold text-white">{func.name}</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              func.status === 'Active' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'
            }`}>{func.status}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Runtime:</span>
              <span className="font-medium">{func.runtime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Memory:</span>
              <span className="font-medium">{func.memory_size} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timeout:</span>
              <span className="font-medium">{func.timeout}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Invocations:</span>
              <span className="font-medium">{func.invocation_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Errors:</span>
              <span className={`font-medium ${func.error_count > 0 ? 'text-error' : 'text-success'}`}>{func.error_count}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            Last modified {new Date(func.last_modified).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function IAMContent({ roles, loading }: { roles: any[], loading: boolean }) {
  if (loading) {
    return <LoadingState service="IAM Roles" />
  }

  if (roles.length === 0) {
    return <EmptyState service="IAM" icon={Shield} description="No roles created yet" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roles.map((role: any, idx: number) => (
        <motion.div
          key={role.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <Shield className="w-5 h-5 text-info mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{role.name}</h3>
              <code className="text-xs bg-black/30 px-2 py-1 rounded block overflow-x-auto">{role.arn}</code>
            </div>
          </div>
          {role.description && (
            <p className="text-sm text-gray-400 mb-3">{role.description}</p>
          )}
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            Created {new Date(role.created_at).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function CloudWatchContent({ logGroups, loading }: { logGroups: any[], loading: boolean }) {
  if (loading) {
    return <LoadingState service="CloudWatch Log Groups" />
  }

  if (logGroups.length === 0) {
    return <EmptyState service="CloudWatch" icon={Activity} description="No log groups created yet" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {logGroups.map((logGroup: any, idx: number) => (
        <motion.div
          key={logGroup.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <Activity className="w-5 h-5 text-accent mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{logGroup.name}</h3>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Retention:</span>
              <span className="font-medium">{logGroup.retention_days ? `${logGroup.retention_days} days` : 'Never expire'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="font-medium">{formatBytes(logGroup.size_bytes)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
            Created {new Date(logGroup.created_at).toLocaleDateString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function LoadingState({ service }: { service: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <motion.div
          className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-gray-400">Loading {service}...</p>
      </div>
    </div>
  )
}

function EmptyState({ service, icon: Icon, description }: { service: string, icon: any, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg"
    >
      <div className="flex justify-center mb-6">
        <div className="p-4 glass-card rounded-full border border-accent/30">
          <Icon className="w-12 h-12 text-accent" />
        </div>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">No {service} Yet</h2>
      <p className="text-gray-400 mb-4">{description}</p>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        💡 Connect a repository or use Quick Deploy to start creating AWS resources. All services run offline—no internet needed!
      </p>
      <button className="px-6 py-3 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center mx-auto backdrop-blur-sm">
        <Plus className="w-5 h-5 mr-2" />
        Create Your First {service}
      </button>
    </motion.div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
