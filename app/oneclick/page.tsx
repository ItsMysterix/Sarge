'use client'

import { AppShell } from '@/components/layout/app-shell'
import { PageTitle } from '@/components/layout/page-title'
import { AutoDeploy } from '@/components/oneclick/auto-deploy'
import { Zap } from 'lucide-react'

export default function OneClickPage() {
  return (
    <AppShell>
      <PageTitle
        title="One‑Click Deploy"
        description="Analyze your repository and launch infrastructure instantly"
        icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
        <div className="mx-auto max-w-5xl">
          <AutoDeploy />
        </div>
      </main>
    </AppShell>
  )
}

