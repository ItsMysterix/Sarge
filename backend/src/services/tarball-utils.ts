import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import * as zlib from 'zlib'
import * as tar from 'tar'
import logger from '../lib/logger'

const tarballLogger = logger.child({ module: 'tarball' })

/**
 * Download and extract a GitHub repository tarball
 */
export async function downloadAndExtractRepository(
  owner: string,
  repo: string,
  branch: string = 'main',
  accessToken?: string
): Promise<{ success: boolean; path: string; error?: string; cleanup: () => void }> {
  const tempDir = path.join(os.tmpdir(), `sarge-deploy-${Date.now()}`)

  let cleanupFn = () => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      tarballLogger.info({ tempDir }, `[Tarball] Cleaned up temp directory: ${tempDir}`)
    }
  }

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true })

    // Prefer GitHub API endpoint when a token is available (supports private repos) and fall back to public tarball URL.
    const useApiEndpoint = !!accessToken
    const tarballUrl = useApiEndpoint
      ? `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`
      : `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.tar.gz`

    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
      headers.Accept = 'application/octet-stream'
    }

    tarballLogger.info({ tarballUrl }, `[Tarball] Downloading from ${tarballUrl}`)
    const response = await fetch(tarballUrl, { headers })
    if (!response.ok) {
      // If the authenticated API URL fails (e.g., rate limit), try the public tarball as a fallback.
      if (useApiEndpoint) {
        const fallbackUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.tar.gz`
        tarballLogger.warn({ status: response.statusText, fallbackUrl }, `[Tarball] API tarball failed. Retrying via public URL`)
        const fallbackResp = await fetch(fallbackUrl)
        if (fallbackResp.ok) {
          return await writeAndExtract(fallbackResp, tempDir)
        }
      }
      return {
        success: false,
        path: '',
        error: `Failed to download tarball: ${response.statusText}`,
        cleanup: cleanupFn,
      }
    }

    return await writeAndExtract(response, tempDir)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    tarballLogger.error({ msg: '[Tarball] Error', err: error })
    cleanupFn()
    return { success: false, path: '', error: msg, cleanup: () => { } }
  }
}

async function writeAndExtract(
  response: any,
  tempDir: string
): Promise<{ success: boolean; path: string; error?: string; cleanup: () => void }> {
  // Download and extract in one go
  const buffer = await response.arrayBuffer()
  const tarPath = path.join(tempDir, 'repo.tar.gz')
  fs.writeFileSync(tarPath, Buffer.from(buffer))

  tarballLogger.info({ bytes: buffer.byteLength }, `[Tarball] Downloaded ${buffer.byteLength} bytes`)

  // Extract tar.gz
  return new Promise((resolve) => {
    const gunzip = zlib.createGunzip()
    const extractStream = tar.extract({ cwd: tempDir })

    const readStream = fs.createReadStream(tarPath)

    extractStream.on('finish', () => {
      tarballLogger.info('[Tarball] Extracted successfully')

      // The tarball extracts to a directory like `repo-main/`
      const entries = fs.readdirSync(tempDir)
      const extracted = entries.find(e => e !== 'repo.tar.gz' && fs.statSync(path.join(tempDir, e)).isDirectory())

      if (extracted) {
        const repoPath = path.join(tempDir, extracted)
        tarballLogger.info({ repoPath }, `[Tarball] Repository extracted to ${repoPath}`)
        resolve({
          success: true,
          path: repoPath,
          cleanup: () => {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true })
              tarballLogger.info({ tempDir }, `[Tarball] Cleaned up temp directory: ${tempDir}`)
            }
          },
        })
      } else {
        resolve({
          success: false,
          path: '',
          error: 'Failed to find extracted repository directory',
          cleanup: () => {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true })
              tarballLogger.info({ tempDir }, `[Tarball] Cleaned up temp directory: ${tempDir}`)
            }
          },
        })
      }
    })

    extractStream.on('error', (err: Error) => {
      tarballLogger.error({ msg: '[Tarball] Extraction error', err: err.message })
      resolve({
        success: false,
        path: '',
        error: err.message,
        cleanup: () => {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
            console.log(`[Tarball] Cleaned up temp directory: ${tempDir}`)
          }
        },
      })
    })

    readStream.on('error', (err: Error) => {
      tarballLogger.error({ msg: '[Tarball] Read error', err: err.message })
      resolve({
        success: false,
        path: '',
        error: err.message,
        cleanup: () => {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
            console.log(`[Tarball] Cleaned up temp directory: ${tempDir}`)
          }
        },
      })
    })

    readStream.pipe(gunzip).pipe(extractStream)
  })
}
