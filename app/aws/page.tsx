"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Cloud, Database, Zap, Shield, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AWSEmulationPage() {
  const [activeTab, setActiveTab] = useState("s3")

  const services = [
    { id: "s3", name: "S3", icon: Database, description: "Object storage—buckets, objects, versioning" },
    { id: "dynamo", name: "DynamoDB", icon: Database, description: "NoSQL tables with key-value & document models" },
    { id: "lambda", name: "Lambda", icon: Zap, description: "Run functions locally—invoke, logs, cold starts" },
    { id: "iam", name: "IAM", icon: Shield, description: "Policy evaluation—deny-by-default access control" },
    { id: "cloudwatch", name: "CloudWatch", icon: Activity, description: "Logs & metrics sink for all services" },
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
                </TabsTrigger>
              ))}
            </TabsList>

            {services.map((svc) => (
              <TabsContent key={svc.id} value={svc.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg"
                >
                  <div className="flex justify-center mb-6">
                    <div className="p-4 glass-card rounded-full border border-accent/30">
                      <svc.icon className="w-12 h-12 text-accent" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-3">{svc.name}</h2>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">{svc.description}</p>
                  <div className="glass-card p-6 text-left max-w-2xl mx-auto border border-white/5">
                    <div className="text-sm text-gray-300 space-y-3">
                      <div>
                        <span className="text-accent font-semibold">Status:</span>{" "}
                        <span className="text-gray-400">Ready (offline mode)</span>
                      </div>
                      <div>
                        <span className="text-accent font-semibold">Endpoint:</span>{" "}
                        <code className="text-xs bg-black/30 px-2 py-1 rounded">http://localhost:4566/{svc.id}</code>
                      </div>
                      <div>
                        <span className="text-accent font-semibold">Resources:</span>{" "}
                        <span className="text-gray-400">0 created</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-3">Example usage with AWS SDK v3:</p>
                      <pre className="text-xs bg-black/50 p-4 rounded overflow-x-auto">
                        <code className="text-gray-300">{getSDKExample(svc.id)}</code>
                      </pre>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  )
}

function getSDKExample(serviceId: string): string {
  const examples: Record<string, string> = {
    s3: `import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({ endpoint: "http://localhost:4566" })
const { Buckets } = await s3.send(new ListBucketsCommand({}))`,
    dynamo: `import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"
const dynamo = new DynamoDBClient({ endpoint: "http://localhost:4566" })
const { TableNames } = await dynamo.send(new ListTablesCommand({}))`,
    lambda: `import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda"
const lambda = new LambdaClient({ endpoint: "http://localhost:4566" })
const { Functions } = await lambda.send(new ListFunctionsCommand({}))`,
    iam: `import { IAMClient, ListRolesCommand } from "@aws-sdk/client-iam"
const iam = new IAMClient({ endpoint: "http://localhost:4566" })
const { Roles } = await iam.send(new ListRolesCommand({}))`,
    cloudwatch: `import { CloudWatchClient, ListMetricsCommand } from "@aws-sdk/client-cloudwatch"
const cw = new CloudWatchClient({ endpoint: "http://localhost:4566" })
const { Metrics } = await cw.send(new ListMetricsCommand({}))`,
  }
  return examples[serviceId] || "// SDK example not available"
}
