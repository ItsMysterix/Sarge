import React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export const FilterBar = ({
  searchTerm,
  setSearchTerm,
  activeProvider,
  setActiveProvider,
  allProviders
}: {
  searchTerm: string,
  setSearchTerm: (s: string) => void,
  activeProvider: string,
  setActiveProvider: (s: string) => void,
  allProviders: string[]
}) => (
  <div className="w-full flex flex-col md:flex-row gap-4 p-1.5 bg-muted/30 border border-border rounded-2xl shadow-sm">
    <label className="relative flex-1 group">
      <span className="sr-only">Search infrastructure components</span>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-all" aria-hidden="true" />
      <input
        type="text"
        placeholder="Search components (e.g. S3, Lambda, Vertex)..."
        className="w-full bg-transparent pl-11 pr-4 py-3 text-xs focus:ring-0 outline-none placeholder:text-muted-foreground/50 font-medium"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </label>
    <div className="flex bg-background/50 p-1 rounded-xl border border-border overflow-x-auto no-scrollbar gap-1" role="group" aria-label="Filter by provider">
      {allProviders.map(p => (
        <button
          key={p}
          onClick={() => setActiveProvider(p)}
          aria-pressed={activeProvider === p}
          className={cn(
            "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
            activeProvider === p ? "bg-foreground text-background shadow-md" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  </div>
)
