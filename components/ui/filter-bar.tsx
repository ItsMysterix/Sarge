"use client"

import { motion } from "framer-motion"
import { Search, X, Filter } from "lucide-react"
import { useState } from "react"
import { Button } from "./button"

interface FilterOption {
  id: string
  label: string
  active: boolean
}

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterOption[]
  onFilterToggle?: (filterId: string) => void
  onClearFilters?: () => void
  showFilterToggle?: boolean
}

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  onFilterToggle,
  onClearFilters,
  showFilterToggle = true
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(true)
  const activeFilterCount = filters.filter(f => f.active).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-10 py-2 glass-card border border-white/10 rounded-lg
              text-sm terminal-text text-white placeholder:text-gray-500
              focus:outline-none focus:border-accent/50 transition-colors"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        {showFilterToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-black text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      {showFilters && filters.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex flex-wrap items-center gap-2"
        >
          {filters.map((filter, index) => (
            <motion.button
              key={filter.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onFilterToggle?.(filter.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium terminal-text
                border transition-all duration-200
                ${filter.active
                  ? "bg-accent/20 border-accent text-accent"
                  : "glass-card border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                }
              `}
            >
              {filter.label}
            </motion.button>
          ))}
          
          {activeFilterCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onClearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-medium terminal-text
                text-error hover:bg-error/10 border border-error/30 transition-colors"
            >
              <X className="w-3 h-3 inline mr-1" />
              Clear All
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  )
}
