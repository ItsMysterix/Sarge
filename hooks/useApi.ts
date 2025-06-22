'use client'
import { trpc } from "@/lib/trpc"

export const useMetrics = () => {
  const { isLoading, data } = trpc.metrics.latest.useQuery() 
  const { data: metrics, isLoading: loading } = trpc.metrics.latest.useQuery()
  return { metrics, loading }
}

export const useLiveMetrics = () => {
  const { data } = trpc.metrics.live.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useLiveLogs = () => {
  const { data } = trpc.logs.stream.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useDeploymentStatus = () => {
  const { data } = trpc.deploy.subscribe.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useTriggerDeployment = () => {
  return trpc.deploy.create.useMutation()
}
