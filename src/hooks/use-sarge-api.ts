"use client"

import { trpc } from "@/lib/trpc"
import { useEffect, useState } from "react"

const t = trpc as any

/**
 * useMetrics - Fetch current system metrics
 */
export const useMetrics = () => {
    const { data: metrics, isLoading: loading } = t.metrics.latest.useQuery()
    return { metrics, loading }
}

/**
 * useLiveMetrics - Stream metrics with 3s polling
 */
export const useLiveMetrics = () => {
    const { data, isLoading } = t.metrics.latest.useQuery(undefined, {
        refetchInterval: 3000,
        refetchOnWindowFocus: false,
    })
    return { data, isLoading }
}

/**
 * useLiveLogs - Stream recent logs with 2s polling
 */
export const useLiveLogs = () => {
    const { data, isLoading } = t.logs.recent.useQuery({ limit: 50 }, {
        refetchInterval: 2000,
        refetchOnWindowFocus: false,
    })
    return { data: data?.items ?? [], isLoading }
}

/**
 * useDeploymentStatus - Fetch and poll deployment status
 */
export const useDeploymentStatus = () => {
    const { data, isLoading } = t.deploy.getDeployments.useQuery(undefined, {
        refetchInterval: 5000,
        refetchOnWindowFocus: false,
    })
    return { data, isLoading }
}

export const useTriggerDeployment = () => {
    return t.deploy.create.useMutation()
}

// Settings API
export type UserSettings = {
    id: string
    user_id: string
    slack_alerts: boolean
    auto_rebuild: boolean
    enable_animations?: boolean
    theme_mode?: 'dark' | 'light' | 'auto'
    notifications?: {
        deploySuccess: boolean
        deployFailure: boolean
        serviceDown: boolean
        highCpu: boolean
        highMemory: boolean
        securityAlerts: boolean
        emailNotifications: boolean
        slackNotifications: boolean
    }
}

/**
 * useUserSettings - Manage application-wide user preferences
 */
export const useUserSettings = () => {
    const query = t.settings.get.useQuery()
    const mutation = t.settings.update.useMutation({
        onSuccess: (updated: any) => {
            query.refetch()
        }
    })

    const updateSettings = async (patch: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => {
        return mutation.mutateAsync(patch)
    }

    return {
        data: query.data as UserSettings | null,
        loading: query.isLoading,
        updateSettings
    }
}
