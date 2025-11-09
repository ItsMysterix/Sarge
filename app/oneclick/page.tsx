'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AutoDeploy } from '@/components/oneclick/auto-deploy'

export default function OneClickPage() {
  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">One-Click Deploy</h1>
              <p className="mt-2 text-sm text-gray-400">
                AI analyzes your workspace, installs dependencies, and starts services automatically—just pick a port.
              </p>
            </header>

            {/* Auto Deploy Component */}
            <AutoDeploy />
          </div>
        </main>
      </div>
    </div>
  )
}

