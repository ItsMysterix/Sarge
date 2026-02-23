import React from "react"

export const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`
      relative w-12 h-6 rounded-full transition-colors
      ${enabled ? 'bg-accent' : 'bg-white/10'}
    `}
  >
    <div
      className={`
        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
        ${enabled ? 'translate-x-7' : 'translate-x-1'}
      `}
    />
  </button>
)
