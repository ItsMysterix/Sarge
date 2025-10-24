export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800/80 ${className}`} />
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-zinc-800/80 rounded mb-2 last:mb-0" />
      ))}
    </div>
  )
}
