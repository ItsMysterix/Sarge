"use client"

import { Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState } from "./shared"

export const InventorySection = ({ projectSlug }: { projectSlug: string }) => {
  const inventoryQuery = trpc.commandCenter.getInventory.useQuery({ projectSlug })
  const resources = inventoryQuery.data || []

  if (inventoryQuery.isLoading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {resources.length === 0 ? (
        <EmptyState icon={Box} title="No cloud assets discovered." subtitle="Connect a provider and deploy to see resources here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res: any) => (
            <Card key={res.id} className="group hover:border-foreground/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted border border-border group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Box className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{res.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{(res.type || '').split(':').pop()}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-widest bg-muted text-foreground">{res.status}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono font-medium">{res.region}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
