"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X, Bug, MessageSquare, ExternalLink, Github, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  // Constants for professional tools
  const GITHUB_ISSUES_URL = "https://github.com/ItsMysterix/Sarge/issues/new"
  const CANNY_FEEDBACK_URL = "https://sarge.canny.io/feedback" // Placeholder

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-6 z-[101] outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              Support Center
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Choose how you&apos;d like to reach out. We use professional tools to track and prioritize requests.
          </p>

          <div className="grid gap-4">
            {/* GitHub Issues - Bugs */}
            <a 
              href={GITHUB_ISSUES_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform">
                <Bug className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-white">Report a Bug</h3>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Track technical issues and contribute directly via <strong>GitHub Issues</strong>.
                </p>
              </div>
            </a>

            {/* Canny - Feedback & Roadmap */}
            <a 
              href={CANNY_FEEDBACK_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-white">Feature Requests</h3>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Suggest features and upvote upcoming roadmap items on <strong>Canny</strong>.
                </p>
              </div>
            </a>

            {/* Discord/Community Placeholder */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01] opacity-60">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/70">Community Discord</h3>
                <p className="text-xs text-muted-foreground italic">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="ghost" className="text-xs h-8">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
