"use client"

import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BillingTabProps {
  stacks: any[]
  awsSummary: any
}

export function BillingTab({ stacks, awsSummary }: BillingTabProps) {
  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-white/10 rounded-xl md:col-span-2 space-y-6">
          <div className="flex items-start justify-between">
             <div>
                <h3 className="text-lg font-medium">Current Plan</h3>
                <p className="text-sm text-muted-foreground">You are on the <span className="text-white font-medium">Pro Plan</span>.</p>
             </div>
             <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-medium rounded-full border border-violet-500/30">
               $20/month
             </span>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next billing date</span>
              <span>March 1, 2026</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment method</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>•••• 4242</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">Manage Subscription</Button>
        </div>

        <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
           <div>
              <h3 className="text-lg font-medium">Usage</h3>
              <p className="text-sm text-muted-foreground">Resource consumption.</p>
           </div>
           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-xs mb-1.5">
                    <span>Stacks</span>
                    <span className="text-muted-foreground">{stacks?.length || 0} / 50</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[10%] rounded-full" />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-xs mb-1.5">
                    <span>S3 Buckets</span>
                    <span className="text-muted-foreground">{awsSummary?.s3?.bucketCount || 0} / 100</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[5%] rounded-full" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
