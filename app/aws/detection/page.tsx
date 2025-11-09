'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useEffect, useState } from 'react'
import { useProject } from '@/lib/project-context'
import { trpc } from '@/lib/trpc'
import { motion } from 'framer-motion'
import { Loader2, Cloud, DollarSign, Activity, AlertCircle, RefreshCw, FileCode, Package } from 'lucide-react'

interface DetectedService {
  type: string
  name: string
  config: Record<string, any>
  detectedFrom: string[]
}

interface CostEstimate {
  service: string
  serviceName: string
  monthlyCost: number
  breakdown: Array<{
    item: string
    quantity: number
    unit: string
    unitCost: number
    totalCost: number
  }>
  assumptions: string[]
}

export default function AWSDetectionPage() {
  const { currentProject } = useProject()
  const [isDetecting, setIsDetecting] = useState(false)
  const [services, setServices] = useState<DetectedService[]>([])
  const [costs, setCosts] = useState<CostEstimate[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [detectionInfo, setDetectionInfo] = useState<{
    hasAWSConfig: boolean
    hasCloudFormation: boolean
    hasTerraform: boolean
    hasCDK: boolean
    awsSDKVersion?: string
  } | null>(null)

  const t = trpc as any
  const detectMutation = t.aws.detectServices.useMutation()

  const handleDetect = async () => {
    if (!currentProject) return

    setIsDetecting(true)
    try {
      const result = await detectMutation.mutateAsync({
        projectSlug: currentProject.slug,
      })

      if (result.success && result.detection) {
        setServices(result.detection.services)
        setDetectionInfo({
          hasAWSConfig: result.detection.hasAWSConfig,
          hasCloudFormation: result.detection.hasCloudFormation,
          hasTerraform: result.detection.hasTerraform,
          hasCDK: result.detection.hasCDK,
          awsSDKVersion: result.detection.awsSDKVersion,
        })

        // Calculate costs for detected services
        if (result.detection.services.length > 0) {
          const costResult = await t.aws.calculateCosts.query({
            services: result.detection.services,
          })

          if (costResult.success && costResult.estimate) {
            setCosts(costResult.estimate.byService)
            setTotalCost(costResult.estimate.totalMonthly)
          }
        }
      }
    } catch (err) {
      console.error('Detection failed:', err)
    } finally {
      setIsDetecting(false)
    }
  }

  useEffect(() => {
    if (currentProject) {
      handleDetect()
    }
  }, [currentProject])

  if (!currentProject) {
    return (
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-4 text-lg font-semibold">No Project Selected</h3>
              <p className="mt-2 text-sm text-gray-400">
                Please select a project to detect AWS resources
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Cloud className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">AWS Detection & Cost Analysis</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-400">
                  Automatically detect AWS services in your codebase and estimate costs
                </p>
              </div>
              <button
                onClick={handleDetect}
                disabled={isDetecting}
                className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-detect
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {isDetecting && services.length === 0 ? (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
                <p className="mt-4 text-sm text-gray-400">
                  Scanning repository for AWS services...
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Analyzing CloudFormation, Terraform, source code, and dependencies
                </p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-1 items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Cloud className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-4 text-lg font-semibold">No AWS Services Detected</h3>
                <p className="mt-2 text-sm text-gray-400">
                  No AWS services were found in this project.
                </p>
                {detectionInfo && (
                  <div className="mt-4 glass-card border border-white/10 inline-block rounded-lg p-4 text-left">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Detection Summary:</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3 w-3" />
                        CloudFormation: {detectionInfo.hasCloudFormation ? '✓ Found' : '✗ Not found'}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3 w-3" />
                        Terraform: {detectionInfo.hasTerraform ? '✓ Found' : '✗ Not found'}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3 w-3" />
                        AWS CDK: {detectionInfo.hasCDK ? '✓ Found' : '✗ Not found'}
                      </div>
                      {detectionInfo.awsSDKVersion && (
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3" />
                          AWS SDK: v{detectionInfo.awsSDKVersion}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid gap-4 md:grid-cols-3 mb-6"
              >
                <div className="glass-card border border-white/10 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold">Services Detected</h3>
                  </div>
                  <p className="text-3xl font-bold">{services.length}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Across {new Set(services.flatMap(s => s.detectedFrom)).size} files
                  </p>
                </div>

                <div className="glass-card border border-white/10 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold">Est. Monthly Cost</h3>
                  </div>
                  <p className="text-3xl font-bold">${totalCost.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    ${(totalCost * 12).toFixed(2)}/year • Based on typical usage
                  </p>
                </div>

                <div className="glass-card border border-white/10 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    <h3 className="font-semibold">Infrastructure</h3>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {detectionInfo?.hasCloudFormation && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                        CloudFormation
                      </div>
                    )}
                    {detectionInfo?.hasTerraform && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-400" />
                        Terraform
                      </div>
                    )}
                    {detectionInfo?.hasCDK && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-400" />
                        AWS CDK
                      </div>
                    )}
                    {detectionInfo?.awsSDKVersion && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400" />
                        AWS SDK v{detectionInfo.awsSDKVersion}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Services List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card border border-white/10 rounded-lg"
              >
                <div className="border-b border-white/10 p-4">
                  <h2 className="text-lg font-semibold">Detected Services</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    AWS services found in your codebase with cost breakdown
                  </p>
                </div>
                <div className="divide-y divide-white/10">
                  {services.map((service, idx) => {
                    const costData = costs.find(c => c.serviceName === service.name)
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="rounded bg-accent/20 border border-accent/30 px-2 py-1 text-xs font-semibold text-accent">
                                {service.type}
                              </span>
                              <h3 className="font-medium">{service.name}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {service.detectedFrom.map((file, i) => (
                                <span
                                  key={i}
                                  className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded"
                                >
                                  📄 {file}
                                </span>
                              ))}
                            </div>
                          </div>
                          {costData && (
                            <div className="text-right ml-4">
                              <p className="text-lg font-semibold text-green-400">
                                ${costData.monthlyCost.toFixed(2)}/mo
                              </p>
                              <p className="text-xs text-gray-400">
                                ${(costData.monthlyCost * 12).toFixed(2)}/yr
                              </p>
                            </div>
                          )}
                        </div>

                        {costData && costData.breakdown.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-400">
                              Cost Breakdown:
                            </p>
                            <div className="bg-white/5 rounded-lg p-3 space-y-2">
                              {costData.breakdown.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-400">
                                    {item.item}: {item.quantity.toLocaleString()} {item.unit}
                                  </span>
                                  <span className="font-medium text-green-400">
                                    ${item.totalCost.toFixed(4)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                              <p className="text-xs font-semibold text-blue-400 mb-1">Assumptions:</p>
                              <div className="space-y-1">
                                {costData.assumptions.map((assumption, i) => (
                                  <p key={i} className="text-xs text-gray-400">• {assumption}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
