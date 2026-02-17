"use client"

import { useState } from "react"
import { Globe, Server, Activity, ArrowRight, ShieldCheck, MapPin, Zap } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"

export function GtmManager() {
  const [activeStrategy, setActiveStrategy] = useState("Latency")

  // Mock data for clusters
  const clusters = [
    { id: "us-east-1", region: "US East (N. Virginia)", type: "AWS", status: "Healthy", latency: "24ms", load: 24 },
    { id: "eu-west-1", region: "EU (Ireland)", type: "AWS", status: "Healthy", latency: "88ms", load: 45 },
    { id: "asia-east-1", region: "Asia Pacific (Tokyo)", type: "GCP", status: "Degraded", latency: "142ms", load: 89 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Global Traffic Manager
          </h2>
          <p className="text-muted-foreground">
            Multi-cluster steering and latency-minimized routing powered by Sarge-GTM.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.08]">
          {["Latency", "Geo", "Failover"].map((s) => (
            <Button
              key={s}
              variant={activeStrategy === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveStrategy(s)}
              className={activeStrategy === s ? "bg-white/10" : ""}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Global Health" 
          value="98.4%" 
          trend={{ value: 0.2, direction: "up" }} 
          subtitle="Avg. uptime across regions"
          icon={ShieldCheck}
          color="success"
        />
        <StatCard 
          title="Avg. Latency" 
          value="42ms" 
          trend={{ value: 12, direction: "down" }} 
          subtitle="Edge-to-cluster resolution"
          icon={Zap}
          color="warning"
        />
        <StatCard 
          title="Active Regions" 
          value="12" 
          subtitle="Clusters across 3 clouds"
          icon={Globe}
          color="accent"
        />
      </div>

      <div className="grid gap-4">
        {clusters.map((cluster) => (
          <Card key={cluster.id} className="bg-muted/20 border-border hover:bg-muted/30 transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                    <Server className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{cluster.region}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{cluster.type} Cluster • {cluster.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-mono text-muted-foreground">{cluster.latency}</div>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">Latency</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-muted-foreground">{cluster.load}%</div>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">Current Load</p>
                  </div>
                  <StatusBadge status={cluster.status.toLowerCase()} />
                </div>
              </div>
              <div className="px-4 py-2 flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Routing active</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  Configure <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
