import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import * as zlib from 'zlib'
import * as tar from 'tar'

/**
 * Download and extract a GitHub repository tarball
 */
export async function downloadAndExtractRepository(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<{ success: boolean; path: string; error?: string; cleanup: () => void }> {
  const tempDir = path.join(os.tmpdir(), `sarge-deploy-${Date.now()}`)
  
  let cleanupFn = () => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      console.log(`[Tarball] Cleaned up temp directory: ${tempDir}`)
    }
  }
  
  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true })
    
    const tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.tar.gz`
    console.log(`[Tarball] Downloading from ${tarballUrl}`)
    
    const response = await fetch(tarballUrl)
    if (!response.ok) {
      return {
        success: false,
        path: '',
        error: `Failed to download tarball: ${response.statusText}`,
        cleanup: cleanupFn,
      }
    }
    
    // Download and extract in one go
    const buffer = await response.arrayBuffer()
    const tarPath = path.join(tempDir, 'repo.tar.gz')
    fs.writeFileSync(tarPath, Buffer.from(buffer))
    
    console.log(`[Tarball] Downloaded ${buffer.byteLength} bytes`)
    
    // Extract tar.gz
    return new Promise((resolve) => {
      const gunzip = zlib.createGunzip()
      const extractStream = tar.extract({ cwd: tempDir })
      
      const readStream = fs.createReadStream(tarPath)
      
      extractStream.on('finish', () => {
        console.log(`[Tarball] Extracted successfully`)
        
        // The tarball extracts to a directory like `repo-main/`
        const entries = fs.readdirSync(tempDir)
        const extracted = entries.find(e => e !== 'repo.tar.gz' && fs.statSync(path.join(tempDir, e)).isDirectory())
        
        if (extracted) {
          const repoPath = path.join(tempDir, extracted)
          console.log(`[Tarball] Repository extracted to ${repoPath}`)
          resolve({
            success: true,
            path: repoPath,
            cleanup: cleanupFn,
          })
        } else {
          resolve({
            success: false,
            path: '',
            error: 'Failed to find extracted repository directory',
            cleanup: cleanupFn,
          })
        }
      })
      
      extractStream.on('error', (err) => {
        console.error(`[Tarball] Extraction error: ${err.message}`)
        resolve({
          success: false,
          path: '',
          error: err.message,
          cleanup: cleanupFn,
        })
      })
      
      readStream.on('error', (err) => {
        console.error(`[Tarball] Read error: ${err.message}`)
        resolve({
          success: false,
          path: '',
          error: err.message,
          cleanup: cleanupFn,
        })
      })
      
      readStream.pipe(gunzip).pipe(extractStream)
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[Tarball] Error: ${msg}`)
    cleanupFn()
    return { success: false, path: '', error: msg, cleanup: () => {} }
  }
}
