import React from 'react'
import { Shield, Zap, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ReadyStep({ selectedServices, onDeploy, isDeploying }: { selectedServices: string[], onDeploy: () => void, isDeploying: boolean }) {
  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Final Verification</h2>
        <p className="text-muted-foreground text-xs max-w-2xl font-medium">Review the orchestration blueprint before initializing the deployment sequence across target cloud regions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="bg-card border border-border rounded-2xl p-6 spaces-y-8 shadow-sm">
           <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between mb-4">
              Provisioning Matrix <span>{selectedServices.length} Nodes</span>
           </h3>
           <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {selectedServices.map(id => (
                  <div key={id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg transition-all hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                       <div className="p-1.5 bg-foreground text-background rounded">
                         <Zap className="w-3.5 h-3.5" />
                       </div>
                       <div>
                         <p className="text-[10px] font-bold tracking-tight uppercase">{id.replace(/-/g, ' ')}</p>
                         <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Active Component</p>
                       </div>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
             ))}
           </div>
        </div>

        <div className="flex flex-col space-y-6">
           <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative overflow-hidden">
             <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
                <div className="space-y-2">
                   <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Deployment Guard</h3>
                   <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                     Orchestration requires final confirmation. All security groups, ephemeral storage, and routing tables will be provisioned according to the verified blueprint.
                   </p>
                </div>
             </div>
           </div>
           
           <Button 
            disabled={isDeploying}
            onClick={onDeploy}
            className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all active:scale-[0.98] group"
           >
             {isDeploying ? (
                <div className="flex items-center gap-3">
                   <RefreshCw className="w-4 h-4 animate-spin" />
                   Provisioning...
                </div>
             ) : (
               <div className="flex items-center gap-3">
                 Awaken Environment
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </div>
             )}
           </Button>
        </div>
      </div>
    </div>
  )
}
