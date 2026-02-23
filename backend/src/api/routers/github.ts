import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { apiLogger } from '../../lib/logger'
import { TRPCError } from '@trpc/server'

/**
 * GitHub Router - Fetch real repository data
 */
export const githubRouter = router({
  // Get repository info
  getRepoInfo: secureProcedure('github.getRepoInfo')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
    }))
    .query(async ({ input }) => {
      const { owner, repo } = input

      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              'Authorization': `token ${process.env.GITHUB_TOKEN}`
            })
          }
        })

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json() as any

        return {
          name: data.name,
          fullName: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          openIssues: data.open_issues_count,
          language: data.language,
          size: data.size,
          defaultBranch: data.default_branch,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          pushedAt: data.pushed_at,
          homepage: data.homepage,
          topics: data.topics || [],
        }
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching GitHub repo')
        throw new Error('Failed to fetch repository data')
      }
    }),

  // Get repository commits
  getCommits: secureProcedure('github.getCommits')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const { owner, repo, limit } = input

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
              })
            }
          }
        )

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json() as any[]

        return data.map((commit: any) => ({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          url: commit.html_url,
        }))
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching commits')
        throw new Error('Failed to fetch commits')
      }
    }),

  // Get repository languages
  getLanguages: secureProcedure('github.getLanguages')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
    }))
    .query(async ({ input }) => {
      const { owner, repo } = input

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/languages`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
              })
            }
          }
        )

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json() as Record<string, number>

        // Calculate percentages
        const total = Object.values(data).reduce((sum: number, bytes: number) => sum + bytes, 0)
        const languages = Object.entries(data).map(([name, bytes]) => ({
          name,
          bytes,
          percentage: ((bytes / total) * 100).toFixed(1),
        }))

        return languages.sort((a, b) => b.bytes - a.bytes)
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching languages')
        throw new Error('Failed to fetch languages')
      }
    }),

  // Get repository contributors
  getContributors: secureProcedure('github.getContributors')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const { owner, repo, limit } = input

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${limit}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
              })
            }
          }
        )

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json() as any[]

        return data.map((contributor: any) => ({
          login: contributor.login,
          avatar: contributor.avatar_url,
          contributions: contributor.contributions,
          url: contributor.html_url,
        }))
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching contributors')
        throw new Error('Failed to fetch contributors')
      }
    }),

  // Get repository activity (issues, PRs, etc.)
  getActivity: secureProcedure('github.getActivity')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
    }))
    .query(async ({ input }) => {
      const { owner, repo } = input

      try {
        // Fetch issues and PRs
        const [issuesRes, prsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=5`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
              })
            }
          }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=5`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              ...(process.env.GITHUB_TOKEN && {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`
              })
            }
          })
        ])

        const issues = await issuesRes.json() as any[]
        const prs = await prsRes.json() as any[]

        return {
          openIssues: issues.length,
          openPRs: prs.length,
          recentIssues: issues.slice(0, 3).map((issue: any) => ({
            title: issue.title,
            number: issue.number,
            url: issue.html_url,
            createdAt: issue.created_at,
          })),
          recentPRs: prs.slice(0, 3).map((pr: any) => ({
            title: pr.title,
            number: pr.number,
            url: pr.html_url,
            createdAt: pr.created_at,
          })),
        }
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching activity')
        throw new Error('Failed to fetch activity')
      }
    }),

  // Get Dependabot vulnerability alerts
  getVulnerabilities: secureProcedure('github.getVulnerabilities')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
    }))
    .query(async ({ input }) => {
      const { owner, repo } = input
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      }
      if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`

      try {
        // Dependabot alerts endpoint
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=50`,
          { headers }
        )

        if (response.status === 404 || response.status === 403) {
          // Dependabot may not be enabled or user lacks permission
          return { alerts: [], enabled: false, message: 'Dependabot alerts not enabled or insufficient permissions.' }
        }

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
        const data = await response.json() as any[]

        const alerts = (data || []).map((alert: any) => ({
          id: alert.number,
          state: alert.state,
          severity: alert.security_advisory?.severity || 'unknown',
          summary: alert.security_advisory?.summary || alert.security_vulnerability?.package?.name,
          description: alert.security_advisory?.description?.slice(0, 200),
          package: alert.security_vulnerability?.package?.name,
          ecosystem: alert.security_vulnerability?.package?.ecosystem,
          vulnerableRange: alert.security_vulnerability?.vulnerable_version_range,
          patchedVersion: alert.security_vulnerability?.first_patched_version?.identifier,
          cveId: alert.security_advisory?.cve_id,
          ghsaId: alert.security_advisory?.ghsa_id,
          url: alert.html_url,
          createdAt: alert.created_at,
          fixedAt: alert.fixed_at,
        }))

        // Group by severity
        const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
        for (const a of alerts) {
          const sev = a.severity?.toLowerCase() as keyof typeof bySeverity
          if (sev in bySeverity) bySeverity[sev]++
        }

        return { alerts, enabled: true, summary: bySeverity }
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching vulnerabilities')
        return { alerts: [], enabled: false, message: 'Failed to fetch vulnerability data.' }
      }
    }),

  // Get repository dependencies (parse package.json, requirements.txt, etc.)
  getDependencies: secureProcedure('github.getDependencies')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
    }))
    .query(async ({ input }) => {
      const { owner, repo } = input
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      }
      if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`

      const dependencies: any[] = []

      try {
        // Try package.json first (Node.js)
        const pkgRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
          { headers }
        )
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json() as any
          const content = Buffer.from(pkgData.content, 'base64').toString('utf-8')
          const pkg = JSON.parse(content)

          const addDeps = (deps: Record<string, string>, type: string) => {
            for (const [name, version] of Object.entries(deps || {})) {
              dependencies.push({
                name,
                version: String(version),
                type,
                ecosystem: 'npm',
                outdated: false, // Would need npm registry call to check
              })
            }
          }

          addDeps(pkg.dependencies || {}, 'production')
          addDeps(pkg.devDependencies || {}, 'development')
        }

        // Try requirements.txt (Python)
        const reqRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`,
          { headers }
        )
        if (reqRes.ok) {
          const reqData = await reqRes.json() as any
          const content = Buffer.from(reqData.content, 'base64').toString('utf-8')
          for (const line of content.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)([><=!~]+.+)?$/)
            if (match) {
              dependencies.push({
                name: match[1],
                version: match[2] || '*',
                type: 'production',
                ecosystem: 'pip',
                outdated: false,
              })
            }
          }
        }

        // Try go.mod (Go)
        const goRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/go.mod`,
          { headers }
        )
        if (goRes.ok) {
          const goData = await goRes.json() as any
          const content = Buffer.from(goData.content, 'base64').toString('utf-8')
          const requireBlock = content.match(/require \(([\s\S]*?)\)/)?.[1] || ''
          for (const line of requireBlock.split('\n')) {
            const match = line.trim().match(/^(\S+)\s+(\S+)/)
            if (match) {
              dependencies.push({
                name: match[1],
                version: match[2],
                type: 'production',
                ecosystem: 'go',
                outdated: false,
              })
            }
          }
        }

        return {
          dependencies,
          totalCount: dependencies.length,
          byEcosystem: dependencies.reduce((acc: Record<string, number>, d) => {
            acc[d.ecosystem] = (acc[d.ecosystem] || 0) + 1
            return acc
          }, {}),
          byType: dependencies.reduce((acc: Record<string, number>, d) => {
            acc[d.type] = (acc[d.type] || 0) + 1
            return acc
          }, {}),
        }
      } catch (error) {
        apiLogger.error({ error, input }, 'Error fetching dependencies')
        return { dependencies: [], totalCount: 0, byEcosystem: {}, byType: {} }
      }
    }),

  /**
   * Sync integrations from GitHub (discover what's already installed)
   * This allows Sarge to automatically verify and connect services like 
   * Vercel, Sentry, or AWS if they are already tied to your GitHub account.
   */
  syncGitHubIntegrations: secureProcedure('github.syncGitHubIntegrations')
    .mutation(async ({ ctx }) => {
      const userId = ctx.session?.user?.id
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

      // 1. Get GitHub Token
      let token = (ctx.session as any)?.accessToken
      if (!token) {
        const { getProviderCredentials } = await import('../lib/credentials')
        const credentials = await getProviderCredentials('github', ctx.db, userId)
        token = credentials?.github_token || (credentials as any)?.access_token
      }

      if (!token) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'GitHub not connected. Please connect GitHub first.',
        })
      }

      try {
        // 2a. Fetch User Installations (GitHub Apps)
        const instRes = await fetch('https://api.github.com/user/installations', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`
          }
        })

        // 2b. Fetch Marketplace Purchases
        const marketRes = await fetch('https://api.github.com/user/marketplace_purchases', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`
          }
        })

        const [instData, marketData] = await Promise.all([
          instRes.ok ? instRes.json() : Promise.resolve({ installations: [] }),
          marketRes.ok ? marketRes.json() : Promise.resolve([])
        ])

        const installations = (instData as any).installations || []
        const purchases = (marketData as any) || []

        // 3. Map GitHub identifiers to Sarge Providers
        const mapping: Record<string, string> = {
          // Compute & Hosting (OAuth Supported)
          'vercel': 'vercel',
          'netlify': 'netlify',
          'railway': 'railway',
          'heroku': 'heroku',
          'fly': 'fly',
          'digitalocean': 'digitalocean',
          'google-cloud': 'gcp',
          'azure': 'azure',

          // Databases & Backend (OAuth Supported)
          'supabase': 'supabase',
          'neon-builder': 'neon',
          'planetscale': 'planetscale',

          // Identity & Security (OAuth Supported)
          'auth0': 'auth0',
          'clerk': 'clerk',

          // Monitoring & Analytics (OAuth Supported)
          'sentry': 'sentry',
          'datadog': 'datadog',

          // FinTech & APIs (OAuth Supported)
          'stripe': 'stripe',
          'alchemy-node': 'alchemy'
        }

        const discovered: string[] = []

        // Process App Installations
        for (const inst of installations) {
          const slug = (inst.app_slug || '').toLowerCase()
          if (mapping[slug]) discovered.push(mapping[slug])
        }

        // Process Marketplace Purchases
        for (const purchase of purchases) {
          const slug = (purchase.account?.login || '').toLowerCase()
          if (mapping[slug]) discovered.push(mapping[slug])
        }

        // Unique set of discovered providers
        const uniqueDiscovered = Array.from(new Set(discovered))

        for (const providerId of uniqueDiscovered) {
          // Discovery Phase: Detected presence via GitHub, but not yet authorized for direct API control
          const metadata = { method: 'github_discovery_bridge', discovered_at: new Date().toISOString() }

          // 1. Mark as 'discovered' for UI tracking
          await ctx.db.query(
            `INSERT INTO connected_providers (project_slug, provider_id, status, credentials, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (project_slug, provider_id) 
             DO UPDATE SET status = 'discovered', credentials = EXCLUDED.credentials, updated_at = NOW()`,
            ['global', providerId, 'discovered', JSON.stringify(metadata)]
          ).catch(e => apiLogger.warn({ e, providerId }, 'Failed to update connected_providers in discovery'))

          // 2. Clear any stale credentials (safety first)
          const { deleteProviderCredentials } = await import('../lib/credentials');
          await deleteProviderCredentials(providerId, ctx.db, userId).catch(() => { })
        }

        return {
          success: true,
          count: uniqueDiscovered.length,
          discovered: uniqueDiscovered,
          totalScanned: installations.length + purchases.length
        }
      } catch (error) {
        apiLogger.error({ error, userId }, 'Error syncing GitHub integrations')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync GitHub integrations',
        })
      }
    }),
})
