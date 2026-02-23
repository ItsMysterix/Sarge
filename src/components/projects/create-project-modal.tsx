import React from 'react'
import { X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GridLoader } from '@/components/ui/grid-loader'

export function CreateProjectModal({ onClose, onSubmit, name, setName, isPending }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Create Project</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Configure your new workspace.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="modal-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project Name</Label>
            <Input 
              id="modal-name" 
              value={name} 
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="My Awesome App" 
              className="mt-2 bg-muted/50 border-border focus:border-foreground/50 font-medium"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-medium bg-muted/30 p-2 rounded border border-border">
            A unique slug and workspace identifier will be generated automatically.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-muted text-[10px] font-bold uppercase tracking-widest">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="bg-foreground text-background hover:bg-foreground/90 text-[10px] font-bold uppercase tracking-widest px-6">
              {isPending && <GridLoader size="sm" className="mr-2" />}
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
