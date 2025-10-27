import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as tar from 'tar'

export type BackupCreateOptions = {
  outFile: string
  dataRoot: string
  passphrase?: string
}

export type BackupRestoreOptions = {
  file: string
  dataRoot: string
  passphrase?: string
  clean?: boolean
}

export type BackupReport = {
  artifact: string
  sizeBytes: number
  durationMs: number
  checksumSha256: string
}

export async function createBackup(opts: BackupCreateOptions): Promise<BackupReport> {
  const start = Date.now()
  const tmpTar = opts.outFile.endsWith('.tar.gz') ? opts.outFile : opts.outFile + '.tar.gz'

  // Build manifest with checksums
  const manifest: { files: Array<{ rel: string; size: number; sha256: string }> } = { files: [] }
  const addDir = (rel: string) => {
    const abs = path.join(opts.dataRoot, rel)
    if (!fs.existsSync(abs)) return [] as string[]
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else files.push(p)
      }
    }
    walk(abs)
    for (const f of files) {
      const relPath = path.relative(opts.dataRoot, f)
      const buf = fs.readFileSync(f)
      const h = crypto.createHash('sha256').update(buf).digest('hex')
      manifest.files.push({ rel: relPath, size: buf.length, sha256: h })
    }
    return files
  }

  // Include key workspace folders
  const includeRel = ['state.json', 'config.json', 'logs', 'snapshots', 's3', 'dynamo']
  // Compute manifest
  for (const rel of includeRel) addDir(rel)
  // Also handle root files explicitly
  for (const f of ['state.json', 'config.json']) {
    const p = path.join(opts.dataRoot, f)
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p)
      manifest.files.push({ rel: f, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') })
    }
  }

  // Materialize manifest.json next to data and include it in the archive
  const manifestPath = path.join(opts.dataRoot, '.manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  // Write tar.gz containing the selected folders and the manifest in a single pass
  const filesToInclude = [...includeRel.filter(Boolean), '.manifest.json']
  await tar.create({ gzip: true, cwd: opts.dataRoot, file: tmpTar, portable: true }, filesToInclude)

  // Remove temporary manifest from workspace after packing
  try { fs.unlinkSync(manifestPath) } catch {}

  let finalFile = tmpTar
  // Optional encryption
  if (opts.passphrase) {
    const salt = crypto.randomBytes(16)
    const key = crypto.scryptSync(opts.passphrase, salt, 32)
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const pt = fs.readFileSync(tmpTar)
    const ct = Buffer.concat([cipher.update(pt), cipher.final()])
    const tag = cipher.getAuthTag()
    const header = Buffer.from('SARGEBAK1\n')
    const meta = JSON.stringify({ algo: 'aes-256-gcm', salt: salt.toString('hex'), iv: iv.toString('hex'), tag: tag.toString('hex') }) + '\n'
    finalFile = opts.outFile.endsWith('.sargebak') ? opts.outFile : opts.outFile + '.sargebak'
    fs.writeFileSync(finalFile, Buffer.concat([header, Buffer.from(meta, 'utf8'), ct]))
    if (finalFile !== tmpTar && fs.existsSync(tmpTar)) fs.unlinkSync(tmpTar)
  }

  const sizeBytes = fs.statSync(finalFile).size
  const durationMs = Date.now() - start
  const checksumSha256 = crypto.createHash('sha256').update(fs.readFileSync(finalFile)).digest('hex')
  return { artifact: finalFile, sizeBytes, durationMs, checksumSha256 }
}

export async function restoreBackup(opts: BackupRestoreOptions): Promise<BackupReport> {
  const start = Date.now()
  let tarGzPath = opts.file
  // If encrypted, decrypt
  const head = fs.readFileSync(opts.file, { encoding: 'utf8', flag: 'r' }).slice(0, 10)
  if (head.startsWith('SARGEBAK1')) {
    if (!opts.passphrase) throw new Error('passphrase required for encrypted backup')
    const fd = fs.openSync(opts.file, 'r')
    const headerBuf = Buffer.alloc(10)
    fs.readSync(fd, headerBuf, 0, 10, 0)
    // Read meta line
    let pos = 10
    let metaStr = ''
    while (true) {
      const ch = Buffer.alloc(1)
      const n = fs.readSync(fd, ch, 0, 1, pos++)
      if (n <= 0) break
      if (ch[0] === 0x0a) break
      metaStr += ch.toString('utf8')
    }
    const meta = JSON.parse(metaStr)
    const salt = Buffer.from(meta.salt, 'hex')
    const iv = Buffer.from(meta.iv, 'hex')
    const tag = Buffer.from(meta.tag, 'hex')
    const key = crypto.scryptSync(opts.passphrase, salt, 32)
    const ct = fs.readFileSync(opts.file).slice(10 + metaStr.length + 1)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const pt = Buffer.concat([decipher.update(ct), decipher.final()])
    tarGzPath = opts.file + '.decrypted.tar.gz'
    fs.writeFileSync(tarGzPath, pt)
  }

  if (opts.clean) {
    if (fs.existsSync(opts.dataRoot)) {
      for (const entry of fs.readdirSync(opts.dataRoot)) {
        const p = path.join(opts.dataRoot, entry)
        fs.rmSync(p, { recursive: true, force: true })
      }
    }
  }

  await tar.extract({ file: tarGzPath, cwd: opts.dataRoot })

  const sizeBytes = fs.statSync(opts.file).size
  const durationMs = Date.now() - start
  const checksumSha256 = crypto.createHash('sha256').update(fs.readFileSync(opts.file)).digest('hex')

  // Cleanup temp
  if (tarGzPath.endsWith('.decrypted.tar.gz')) fs.unlinkSync(tarGzPath)

  return { artifact: opts.file, sizeBytes, durationMs, checksumSha256 }
}
