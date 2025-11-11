/**
 * GitHub API Service
 * Fetches repository contents directly from GitHub API (like Vercel)
 * No local cloning required!
 */

import { Octokit } from '@octokit/rest'

export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string // Base64 encoded
  sha: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
}

export class GitHubAPIService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  /**
   * Get repository details
   */
  async getRepo(owner: string, repo: string) {
    const { data } = await this.octokit.repos.get({ owner, repo })
    return data
  }

  /**
   * List files in a directory
   */
  async listFiles(owner: string, repo: string, path: string = '', ref?: string): Promise<GitHubFile[]> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        sha: item.sha,
      }))
    }

    // Single file
    return [
      {
        name: data.name,
        path: data.path,
        type: 'file',
        sha: data.sha,
      },
    ]
  }

  /**
   * Get file content (decoded from base64)
   */
  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    if ('content' in data && data.content) {
      // Decode base64
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }

    throw new Error('File not found or is a directory')
  }

  /**
   * Get latest commit for a branch
   */
  async getLatestCommit(owner: string, repo: string, branch: string = 'main'): Promise<GitHubCommit> {
    const { data } = await this.octokit.repos.getCommit({
      owner,
      repo,
      ref: branch,
    })

    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author?.name || 'Unknown',
        email: data.commit.author?.email || '',
        date: data.commit.author?.date || new Date().toISOString(),
      },
    }
  }

  /**
   * Get commit history
   */
  async getCommits(owner: string, repo: string, branch?: string, perPage = 10): Promise<GitHubCommit[]> {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: perPage,
    })

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || new Date().toISOString(),
      },
    }))
  }

  /**
   * Check if package.json exists (detect Node.js project)
   */
  async hasFile(owner: string, repo: string, filePath: string, ref?: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref,
      })
      return true
    } catch (error: any) {
      if (error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Get package.json content
   */
  async getPackageJson(owner: string, repo: string, ref?: string): Promise<any> {
    const content = await this.getFileContent(owner, repo, 'package.json', ref)
    return JSON.parse(content)
  }

  /**
   * Detect project type based on files
   */
  async detectProjectType(owner: string, repo: string, ref?: string): Promise<string> {
    const checks = [
      { file: 'package.json', type: 'nodejs' },
      { file: 'requirements.txt', type: 'python' },
      { file: 'Gemfile', type: 'ruby' },
      { file: 'go.mod', type: 'go' },
      { file: 'Cargo.toml', type: 'rust' },
      { file: 'pom.xml', type: 'java-maven' },
      { file: 'build.gradle', type: 'java-gradle' },
    ]

    for (const check of checks) {
      if (await this.hasFile(owner, repo, check.file, ref)) {
        return check.type
      }
    }

    return 'unknown'
  }

  /**
   * Get branches
   */
  async getBranches(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listBranches({ owner, repo })
    return data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      commit: branch.commit.sha,
    }))
  }

  /**
   * Create a webhook (for auto-deploy on push)
   */
  async createWebhook(owner: string, repo: string, webhookUrl: string) {
    const { data } = await this.octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        insecure_ssl: '0',
      },
      events: ['push', 'pull_request'],
      active: true,
    })
    return data
  }
}

/**
 * Factory function to create GitHub API service
 */
export function createGitHubAPI(accessToken: string): GitHubAPIService {
  return new GitHubAPIService(accessToken)
}
