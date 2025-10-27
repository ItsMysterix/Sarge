"use client"

import { trpc } from '@/lib/trpc'

export function useLicense() {
  const q = (trpc.sarge as any).license.status.useQuery()
  return {
    status: q.data as undefined | {
      edition: 'community'|'pro'
      features: { teamSpaces: boolean; cloudApply: boolean }
      valid: boolean
      expired: boolean
      inGrace: boolean
      expiresAt?: string
      messages: string[]
    },
    isLoading: q.isLoading,
    error: q.error as any,
  }
}
