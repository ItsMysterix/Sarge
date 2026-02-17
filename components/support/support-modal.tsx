"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Bug, MessageSquare, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'bug' | 'feedback'
}

export function SupportModal({ open, onOpenChange, defaultTab = 'bug' }: SupportModalProps) {
  const [tab, setTab] = useState<'bug' | 'feedback'>(defaultTab)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast: toast } = useToast()

  const createTicketMutation = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast({ type: "success", title: "Sent!", description: "We've received your message." })
      setSubject("")
      setDescription("")
      onOpenChange(false)
    },
    onError: (error) => {
      toast({ type: "error", title: "Error", description: error.message })
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const metadata = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    }

    createTicketMutation.mutate({
      type: tab,
      subject,
      description,
      priority: tab === 'bug' ? 'medium' : 'low',
      metadata,
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-6 z-[101] outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              {tab === 'bug' ? 'Report a Bug' : 'Give Feedback'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setTab('bug')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-sm font-medium",
                tab === 'bug' 
                  ? "bg-red-500/10 border-red-500/30 text-red-500" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              )}
            >
              <Bug className="w-4 h-4" />
              Bug Report
            </button>
            <button 
              onClick={() => setTab('feedback')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-sm font-medium",
                tab === 'feedback' 
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Feedback
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder={tab === 'bug' ? "What's broken?" : "What's on your mind?"}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="bg-black border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description"
                rows={4}
                placeholder={tab === 'bug' ? "Please describe the steps to reproduce..." : "How can we improve Sarge?"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm focus:border-violet-500/50 outline-none transition-all resize-none"
              />
            </div>

            <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex gap-3 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>System info (browser, route, timestamp) will be automatically attached to help us debug.</p>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-white/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
