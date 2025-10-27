"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Layers, Plus, Archive, Play, Pause } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function StacksPage() {
  const [stacks, setStacks] = useState<any[]>([])

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Stacks</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">
              Compose services into applications—define what runs together
            </p>
          </motion.div>

          {/* Empty State */}
          {stacks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 glass-card rounded-full border border-accent/30">
                  <Layers className="w-12 h-12 text-accent" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">No stacks yet</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create a stack to compose services (S3, DynamoDB, Lambda, your APIs) into a cohesive application. 
                Each stack runs independently with its own resources and logs.
              </p>
              <button className="glass-card px-6 py-3 text-accent hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center mx-auto">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Stack
              </button>
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-500 mb-4">Quick examples:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Web + API + DB</div>
                    <p className="text-xs text-gray-400">Frontend, backend, and DynamoDB table</p>
                  </div>
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Serverless Pipeline</div>
                    <p className="text-xs text-gray-400">Lambda + S3 event triggers</p>
                  </div>
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Microservices</div>
                    <p className="text-xs text-gray-400">Multiple services with shared CloudWatch logs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Future: Stack list UI will go here */}
        </main>
      </div>
    </div>
  )
}
