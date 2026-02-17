"use client"

import { Shield, Activity, RotateCcw, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TimelineItem } from "@/components/ui/timeline-item"

export function RemediationLogs() {
  const events = [
    {
      id: "rem-1",
      timestamp: "12 mins ago",
      incident: "5xx Spike in 'auth-service'",
      action: "Auto-Rollback",
      status: "success",
      details: "Reverted to build v1.2.4 after error rate exceeded 5% threshold."
    },
    {
      id: "rem-2",
      timestamp: "1 hour ago",
      incident: "Memory Pressure on 'worker-group-A'",
      action: "Horizontal Scaling",
      status: "success",
      details: "Provisioned 2 additional replicas via Karpenter in us-east-1."
    },
    {
      id: "rem-3",
      timestamp: "5 hours ago",
      incident: "Unpinned Docker Image Detected",
      action: "Block Deployment",
      status: "failed",
      details: "Deployment halted by Sarge-Scanner. Policy 'SARGE-SEC-01' violation."
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Self-Healing Logs
          </h2>
          <p className="text-muted-foreground">
            Audit trail of AI-driven incident remediations and autonomous actions.
          </p>
        </div>
      </div>

      <div className="grid gap-0">
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            title={event.incident}
            description={event.details}
            timestamp={event.timestamp}
            status={event.status === "success" ? "success" : event.status === "error" ? "error" : "pending"}
            icon={
              event.action.includes("Rollback") ? RotateCcw :
              event.action.includes("Scaling") ? TrendingUp :
              Shield
            }
            metadata={[
              { label: "Action", value: event.action },
              { label: "Result", value: event.status.toUpperCase() }
            ]}
          />
        ))}
      </div>
    </div>
  )
}
