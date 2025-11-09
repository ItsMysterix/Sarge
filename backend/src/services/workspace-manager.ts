/**
 * Local Workspace Manager
 * Clones GitHub repos to local directory for one-click local deployment
 */

import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { spawn } from 'child_process'

const WORKSPACES_DIR = path.join(os.homedir(), '.sarge', 'workspaces')

export interface LocalWorkspace {
  id: string
  name: string
  path: string
  source: 'github' | 'local'
  repoUrl?: string
  branch?: string
  createdAt: Date
  lastUsed: Date
}

export class WorkspaceManager {
  private workspaces: Map<string, LocalWorkspace> = new Map()

  constructor() {
    // Ensure workspaces directory exists
    if (!fs.existsSync(WORKSPACES_DIR)) {
      fs.mkdirSync(WORKSPACES_DIR, { recursive: true })
    }
    this.loadWorkspaces()
  }

  /**
   * Clone a GitHub repo to local workspace
   */
  async cloneRepo(repoUrl: string, branch: string = 'main'): Promise<LocalWorkspace> {
    const repoName = this.extractRepoName(repoUrl)
    const workspaceId = `${repoName}-${Date.now()}`
    const workspacePath = path.join(WORKSPACES_DIR, workspaceId)

    console.log(`[WorkspaceManager] Cloning ${repoUrl} to ${workspacePath}`)

    try {
      // Clone the repo
      await this.execCommand('git', ['clone', '--depth=1', `--branch=${branch}`, repoUrl, workspacePath])

      const workspace: LocalWorkspace = {
        id: workspaceId,
        name: repoName,
        path: workspacePath,
        source: 'github',
        repoUrl,
        branch,
        createdAt: new Date(),
        lastUsed: new Date(),
      }

      this.workspaces.set(workspaceId, workspace)
      this.saveWorkspaces()

      return workspace
    } catch (err: any) {
      // Cleanup on failure
      if (fs.existsSync(workspacePath)) {
        fs.rmSync(workspacePath, { recursive: true, force: true })
      }
      throw new Error(`Failed to clone repo: ${err.message}`)
    }
  }

  /**
   * Register an existing local folder as a workspace
   */
  registerLocal(localPath: string): LocalWorkspace {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Path does not exist: ${localPath}`)
    }

    const folderName = path.basename(localPath)
    const workspaceId = `local-${folderName}-${Date.now()}`

    const workspace: LocalWorkspace = {
      id: workspaceId,
      name: folderName,
      path: localPath,
      source: 'local',
      createdAt: new Date(),
      lastUsed: new Date(),
    }

    this.workspaces.set(workspaceId, workspace)
    this.saveWorkspaces()

    return workspace
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): LocalWorkspace | undefined {
    const workspace = this.workspaces.get(id)
    if (workspace) {
      workspace.lastUsed = new Date()
      this.saveWorkspaces()
    }
    return workspace
  }

  /**
   * List all workspaces
   */
  listWorkspaces(): LocalWorkspace[] {
    return Array.from(this.workspaces.values()).sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
  }

  /**
   * Delete workspace (and files if from GitHub)
   */
  async deleteWorkspace(id: string): Promise<void> {
    const workspace = this.workspaces.get(id)
    if (!workspace) return

    // Only delete files for GitHub clones, not local folders
    if (workspace.source === 'github' && fs.existsSync(workspace.path)) {
      fs.rmSync(workspace.path, { recursive: true, force: true })
    }

    this.workspaces.delete(id)
    this.saveWorkspaces()
  }

  /**
   * Pull latest changes for GitHub workspace
   */
  async pullLatest(id: string): Promise<void> {
    const workspace = this.workspaces.get(id)
    if (!workspace || workspace.source !== 'github') {
      throw new Error('Can only pull GitHub workspaces')
    }

    await this.execCommand('git', ['pull'], workspace.path)
    workspace.lastUsed = new Date()
    this.saveWorkspaces()
  }

  private extractRepoName(repoUrl: string): string {
    // Extract repo name from URL like "https://github.com/user/repo.git"
    const match = repoUrl.match(/\/([^\/]+?)(\.git)?$/)
    return match ? match[1] : 'repo'
  }

  private loadWorkspaces(): void {
    const manifestPath = path.join(WORKSPACES_DIR, 'manifest.json')
    if (fs.existsSync(manifestPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        this.workspaces = new Map(
          data.map((w: any) => [
            w.id,
            {
              ...w,
              createdAt: new Date(w.createdAt),
              lastUsed: new Date(w.lastUsed),
            },
          ])
        )
      } catch (err) {
        console.error('[WorkspaceManager] Failed to load manifest:', err)
      }
    }
  }

  private saveWorkspaces(): void {
    const manifestPath = path.join(WORKSPACES_DIR, 'manifest.json')
    const data = Array.from(this.workspaces.values())
    fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2))
  }

  private execCommand(command: string, args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { cwd, shell: true })

      let stderr = ''

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('error', (err) => {
        reject(new Error(`Failed to start command: ${err.message}`))
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command exited with code ${code}\n${stderr}`))
        }
      })
    })
  }
}

// Singleton instance
export const workspaceManager = new WorkspaceManager()
