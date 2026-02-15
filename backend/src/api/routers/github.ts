import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'

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
        console.error('Error fetching GitHub repo:', error)
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
        console.error('Error fetching commits:', error)
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
        console.error('Error fetching languages:', error)
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
        console.error('Error fetching contributors:', error)
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
        console.error('Error fetching activity:', error)
        throw new Error('Failed to fetch activity')
      }
    }),
})
