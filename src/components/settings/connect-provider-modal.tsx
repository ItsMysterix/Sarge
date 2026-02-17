"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, ShieldCheck } from "lucide-react"

interface ConnectProviderModalProps {
  provider: any | null
  isOpen: boolean
  onClose: () => void
  onConnect: (providerId: string, credentials: Record<string, string>) => Promise<void>
}

export function ConnectProviderModal({ provider, isOpen, onClose, onConnect }: ConnectProviderModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!provider) return null

  const handleInputChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onConnect(provider.id, credentials)
      onClose()
      setCredentials({})
    } catch (error) {
      console.error("Failed to connect provider:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFields = () => {
    switch (provider.id) {
      case 'aws':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="aws_token">AWS Access Key ID</Label>
              <Input 
                id="aws_token" 
                placeholder="AKIA..." 
                value={credentials.aws_token || ''} 
                onChange={e => handleInputChange('aws_token', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aws_secret">AWS Secret Access Key</Label>
              <Input 
                id="aws_secret" 
                type="password"
                placeholder="Enter your secret key" 
                value={credentials.aws_secret || ''} 
                onChange={e => handleInputChange('aws_secret', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aws_region">Default Region</Label>
              <Input 
                id="aws_region" 
                placeholder="us-east-1" 
                value={credentials.aws_region || ''} 
                onChange={e => handleInputChange('aws_region', e.target.value)}
                required
              />
            </div>
          </>
        )
      case 'vercel':
        return (
          <div className="space-y-2">
            <Label htmlFor="vercel_token">Vercel API Token</Label>
            <Input 
              id="vercel_token" 
              type="password"
              placeholder="Enter your Vercel token" 
              value={credentials.vercel_token || ''} 
              onChange={e => handleInputChange('vercel_token', e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">You can create a token in your Vercel Account Settings.</p>
          </div>
        )
      case 'gcp':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="gcp_project_id">GCP Project ID</Label>
              <Input 
                id="gcp_project_id" 
                placeholder="my-cool-project-123" 
                value={credentials.gcp_project_id || ''} 
                onChange={e => handleInputChange('gcp_project_id', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcp_service_account_key">Service Account Key (JSON)</Label>
              <Input 
                id="gcp_service_account_key" 
                type="password"
                placeholder='{"type": "service_account", ...}' 
                value={credentials.gcp_service_account_key || ''} 
                onChange={e => handleInputChange('gcp_service_account_key', e.target.value)}
                required
              />
            </div>
          </>
        )
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="generic_token">{provider.name} API Key / Token</Label>
            <Input 
              id="generic_token" 
              type="password"
              placeholder={`Enter your ${provider.name} token`} 
              value={credentials[`${provider.id}_token`] || ''} 
              onChange={e => handleInputChange(`${provider.id}_token`, e.target.value)}
              required
            />
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Connect {provider.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your credentials to allow Sarge to manage your {provider.name} infrastructure and bills.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {renderFields()}
          
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex items-start gap-3 mt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div className="text-[10px] text-emerald-200/70 leading-relaxed">
              <strong>Secure Storage:</strong> Credentials are encrypted and stored securely. 
              Sarge only uses these keys to orchestrate deployments and pull billing data.
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Connecting..." : `Connect ${provider.name}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
