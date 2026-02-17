"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface NotificationsTabProps {
  deploymentEmails: boolean
  productEmails: boolean
  handleDeploymentEmailChange: (checked: boolean) => void
  handleProductEmailChange: (checked: boolean) => void
}

export function NotificationsTab({
  deploymentEmails,
  productEmails,
  handleDeploymentEmailChange,
  handleProductEmailChange
}: NotificationsTabProps) {
  return (
    <div className="space-y-6 pt-2">
       <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
          <div>
             <h3 className="text-lg font-medium">Email Notifications</h3>
             <p className="text-sm text-muted-foreground">Choose what updates you want to receive.</p>
          </div>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <Label className="text-base">Deployment Status</Label>
                   <p className="text-sm text-muted-foreground">Receive emails when deployments succeed or fail.</p>
                </div>
                <Switch checked={deploymentEmails} onCheckedChange={handleDeploymentEmailChange} />
             </div>
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <Label className="text-base">Product Updates</Label>
                   <p className="text-sm text-muted-foreground">News about new features and improvements.</p>
                </div>
                <Switch checked={productEmails} onCheckedChange={handleProductEmailChange} />
             </div>
          </div>
       </div>
    </div>
  )
}
