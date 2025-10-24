import React from 'react'

export function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-lg border border-zinc-800 bg-zinc-900/60 ${className}`}>{children}</div>
}

export function CardHeader({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`px-4 py-3 border-b border-zinc-800 ${className}`}>{children}</div>
}

export function CardBody({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
