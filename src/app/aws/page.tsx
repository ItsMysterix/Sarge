"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { 
  Cloud, Database, Zap, Shield, Activity, Plus
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function AWSPage() {
  const [activeTab, setActiveTab] = useState<"s3" | "dynamo" | "lambda" | "iam" | "cloudwatch">("s3")
  
  const t = trpc as any
  const s3Query = t.aws?.s3?.listBuckets?.useQuery?.()
  const dynamoQuery = t.aws?.dynamodb?.listTables?.useQuery?.()
  const lambdaQuery = t.aws?.lambda?.listFunctions?.useQuery?.()
  const iamQuery = t.aws?.iam?.listRoles?.useQuery?.()
  const cwQuery = t.aws?.cloudwatch?.listLogGroups?.useQuery?.()

  const tabs = [
    { id: "s3" as const, label: "S3", icon: Database, count: s3Query?.data?.length || 0 },
    { id: "dynamo" as const, label: "DynamoDB", icon: Zap, count: dynamoQuery?.data?.length || 0 },
    { id: "lambda" as const, label: "Lambda", icon: Zap, count: lambdaQuery?.data?.length || 0 },
    { id: "iam" as const, label: "IAM", icon: Shield, count: iamQuery?.data?.length || 0 },
    { id: "cloudwatch" as const, label: "CloudWatch", icon: Activity, count: cwQuery?.data?.length || 0 },
  ]

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <AppShell title="AWS Emulation">
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl w-full animate-fade-in">
        
        {/* Header Removed - managed by AppShell */}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-muted text-foreground border-foreground/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-muted-foreground/20 text-foreground">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
          
          {/* S3 */}
          {activeTab === "s3" && (
            <ResourceList
              title="S3 Buckets"
              loading={s3Query?.isLoading}
              items={s3Query?.data || []}
              empty={{ icon: Database, message: "No buckets created" }}
              renderItem={(bucket: any) => (
                <div key={bucket.id} className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-all bg-muted/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-foreground">{bucket.name}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{bucket.region}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Objects:</span> {bucket.object_count}</div>
                    <div><span className="text-muted-foreground">Size:</span> {formatBytes(bucket.size_bytes)}</div>
                    <div><span className="text-muted-foreground">Versioning:</span> {bucket.versioning_enabled ? "✓" : "✗"}</div>
                  </div>
                </div>
              )}
            />
          )}

          {/* DynamoDB */}
          {activeTab === "dynamo" && (
            <ResourceList
              title="DynamoDB Tables"
              loading={dynamoQuery?.isLoading}
              items={dynamoQuery?.data || []}
              empty={{ icon: Zap, message: "No tables created" }}
              renderItem={(table: any) => (
                <div key={table.id} className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-all bg-muted/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-foreground">{table.name}</h3>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      table.status === "ACTIVE" ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                    )}>{table.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">PK:</span> <code className="text-[10px] bg-muted px-1 rounded text-foreground">{table.partition_key}</code></div>
                    <div><span className="text-muted-foreground">Items:</span> {table.item_count?.toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Size:</span> {formatBytes(table.size_bytes)}</div>
                    <div><span className="text-muted-foreground">RCU/WCU:</span> {table.read_capacity_units}/{table.write_capacity_units}</div>
                  </div>
                </div>
              )}
            />
          )}

          {/* Lambda */}
          {activeTab === "lambda" && (
            <ResourceList
              title="Lambda Functions"
              loading={lambdaQuery?.isLoading}
              items={lambdaQuery?.data || []}
              empty={{ icon: Zap, message: "No functions created" }}
              renderItem={(fn: any) => (
                <div key={fn.id} className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-all bg-muted/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-foreground" />
                      <h3 className="font-medium text-foreground">{fn.name}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{fn.runtime}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Memory:</span> {fn.memory_size}MB</div>
                    <div><span className="text-muted-foreground">Timeout:</span> {fn.timeout}s</div>
                    <div><span className="text-muted-foreground">Invokes:</span> {fn.invocation_count}</div>
                    <div><span className="text-muted-foreground">Errors:</span> <span className={fn.error_count > 0 ? "text-red-500" : "text-foreground"}>{fn.error_count}</span></div>
                  </div>
                </div>
              )}
            />
          )}

          {/* IAM */}
          {activeTab === "iam" && (
            <ResourceList
              title="IAM Roles"
              loading={iamQuery?.isLoading}
              items={iamQuery?.data || []}
              empty={{ icon: Shield, message: "No roles created" }}
              renderItem={(role: any) => (
                <div key={role.id} className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-all bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-foreground" />
                    <h3 className="font-medium text-foreground">{role.name}</h3>
                  </div>
                  <code className="block text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded overflow-x-auto">{role.arn}</code>
                  {role.description && <p className="text-xs text-muted-foreground mt-2">{role.description}</p>}
                </div>
              )}
            />
          )}

          {/* CloudWatch */}
          {activeTab === "cloudwatch" && (
            <ResourceList
              title="CloudWatch Log Groups"
              loading={cwQuery?.isLoading}
              items={cwQuery?.data || []}
              empty={{ icon: Activity, message: "No log groups created" }}
              renderItem={(lg: any) => (
                <div key={lg.id} className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-all bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-foreground" />
                    <h3 className="font-medium text-foreground">{lg.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Retention:</span> {lg.retention_days ? `${lg.retention_days}d` : "Never"}</div>
                    <div><span className="text-muted-foreground">Size:</span> {formatBytes(lg.size_bytes)}</div>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function ResourceList({ title, loading, items, empty, renderItem }: {
  title: string
  loading?: boolean
  items: any[]
  empty: { icon: any; message: string }
  renderItem: (item: any) => React.ReactNode
}) {
  if (loading) {
    return (
      <LoadingScreen title="Communicating with AWS" subtitle="Synchronizing cloud resources..." />
    )
  }

  if (items.length === 0) {
    const Icon = empty.icon
    return (
      <div className="text-center py-16">
        <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-medium mb-1 text-foreground">{empty.message}</h3>
        <p className="text-sm text-muted-foreground mb-6">Create resources via API or code</p>
        <button className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-card border border-border text-sm hover:bg-muted transition-colors text-foreground">
          <Plus className="w-4 h-4" />
          Create {title.split(" ")[0]}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-medium mb-4 text-foreground">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {items.map(renderItem)}
      </div>
    </div>
  )
}
