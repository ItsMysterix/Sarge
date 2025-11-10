'use client'

import { AppShell } from '@/components/layout/app-shell'
import { AutoDeploy } from '@/components/oneclick/auto-deploy'

export default function OneClickPage() {
  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <AutoDeploy />
        </div>
      </main>
    </AppShell>
  )
}

