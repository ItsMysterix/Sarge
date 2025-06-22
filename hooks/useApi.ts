'use client'

import { trpc } from "@/utils/trpc"

export const useMetrics = () => {
  const { data, isLoading } = trpc.refreshMetrics.useMutation()
  return { data, loading: isLoading }
}

export const useLiveMetrics = () => {
  const { data } = trpc.liveMetrics.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useLiveLogs = () => {
  const { data } = trpc.logs.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useDeploymentStatus = () => {
  const { data } = trpc.deploymentStatus.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useTriggerDeployment = () => {
  return trpc.triggerDeployment.useMutation()
}
