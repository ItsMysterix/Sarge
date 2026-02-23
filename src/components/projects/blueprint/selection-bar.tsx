import React from "react"
import { Key, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ServiceOption } from "../InfrastructureBlueprint"

export const SelectionBar = ({
  selectedServices, serviceMap, isConnected, onConnectProvider, onNext
}: {
  selectedServices: string[], serviceMap: Record<string, ServiceOption>, isConnected: (p: string) => boolean, onConnectProvider: (p: string) => void, onNext: () => void
}) => (
  <AnimatePresence>
    {selectedServices.length > 0 && (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-0 right-0 z-50 w-full max-w-4xl mx-auto px-4"
      >
        <div className="bg-foreground text-background p-4 px-6 rounded-2xl shadow-2xl flex items-center justify-between gap-6 border border-border backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {selectedServices.slice(0, 5).map(id => {
                const s = serviceMap[id]
                return s && (
                  <div key={id} className="w-10 h-10 rounded-lg bg-background border-2 border-foreground flex items-center justify-center text-foreground shadow-sm">
                     <s.icon className="w-5 h-5" />
                  </div>
                )
              })}
              {selectedServices.length > 5 && (
                 <div className="w-10 h-10 rounded-lg bg-muted border-2 border-foreground flex items-center justify-center text-foreground font-bold text-[10px]">
                   +{selectedServices.length - 5}
                 </div>
              )}
            </div>
            <div className="hidden sm:block">
               <p className="text-sm font-bold tracking-tight">{selectedServices.length} Selected Nodes</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedServices.some(id => !isConnected(serviceMap[id]?.provider || '')) && (
              <Button
                onClick={() => {
                  const firstUnlinkedId = selectedServices.find(id => !isConnected(serviceMap[id]?.provider || ''))
                  const provider = serviceMap[firstUnlinkedId || '']?.provider
                  if (provider) onConnectProvider(provider)
                }}
                variant="ghost"
                className="h-10 px-4 text-background/60 hover:text-background font-bold uppercase text-[9px] tracking-widest rounded-lg transition-all flex items-center gap-2"
              >
                <Key className="w-3 h-3" /> Bridge All
              </Button>
            )}
            <Button onClick={onNext} className="h-10 px-6 bg-background text-foreground hover:bg-white font-bold uppercase text-[10px] tracking-widest rounded-lg transition-all flex items-center gap-2 group">
              Assembly <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)
