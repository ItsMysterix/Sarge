"use client"
import React, { useEffect } from "react"
export const dynamic = 'force-dynamic'

import { useUser } from "@/lib/clerk-safe"
import { useProject } from "@/lib/project-context"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { 
  TrendingUp, Server, Activity, Zap, ArrowUpRight, GitBranch, Clock, 
  CheckCircle2, Layers, Terminal, Key, Settings, Rocket, Globe, 
  Database, Shield, Play, RotateCcw
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import TimeAgo from "timeago-react"
import { QuickAction } from "@/components/dashboard/quick-action"
import { StatCard } from "@/components/dashboard/stat-card"
import { ResourceLink } from "@/components/dashboard/resource-link"
