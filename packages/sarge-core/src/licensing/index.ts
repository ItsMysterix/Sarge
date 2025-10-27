import fs from 'node:fs'
import path from 'node:path'

export type LicenseFile = {
  edition: 'community' | 'pro'
  features?: string[]
  expiresAt?: string
  graceDays?: number
}

export type LicenseStatus = {
  edition: 'community' | 'pro'
  features: Record<string, boolean>
  valid: boolean
  expired: boolean
  inGrace: boolean
  expiresAt?: string
  messages: string[]
}

function defaultLicense(): LicenseStatus {
  return {
    edition: 'community',
    features: { teamSpaces: false, cloudApply: false },
    valid: true,
    expired: false,
    inGrace: false,
    messages: ['Community edition: advanced features locked']
  }
}

export function readLicenseFile(opts?: { dataRoot?: string; licensePath?: string }): LicenseFile | null {
  const roots = [] as string[]
  const cwd = process.cwd()
  const dataRoot = opts?.dataRoot ?? path.resolve(cwd, 'data/sarge/workspaces/default')
  const globalRoot = path.resolve(cwd, 'data/sarge')
  if (opts?.licensePath) roots.push(opts.licensePath)
  roots.push(path.join(globalRoot, 'license.json'))
  roots.push(path.join(dataRoot, 'license.json'))
  for (const f of roots) {
    try {
      if (fs.existsSync(f)) {
        const parsed = JSON.parse(fs.readFileSync(f, 'utf8')) as LicenseFile
        return parsed
      }
    } catch {/* ignore */}
  }
  return null
}

export function getStatus(opts?: { dataRoot?: string; licensePath?: string; now?: Date }): LicenseStatus {
  const lic = readLicenseFile(opts)
  if (!lic) return defaultLicense()
  const features = Object.fromEntries((lic.features ?? []).map(f => [f, true])) as Record<string, boolean>
  const now = (opts?.now ?? new Date()).getTime()
  const expiresAtMs = lic.expiresAt ? Date.parse(lic.expiresAt) : NaN
  const graceMs = (lic.graceDays ?? 0) * 24 * 60 * 60 * 1000
  const status: LicenseStatus = {
    edition: lic.edition ?? 'community',
    features: { teamSpaces: !!features['teamSpaces'], cloudApply: !!features['cloudApply'] },
    valid: true,
    expired: false,
    inGrace: false,
    expiresAt: lic.expiresAt,
    messages: []
  }
  if (!Number.isNaN(expiresAtMs)) {
    if (now > expiresAtMs) {
      status.expired = true
      if (now <= expiresAtMs + graceMs) {
        status.inGrace = true
        status.messages.push('License expired: grace period active')
      } else {
        status.valid = false
        status.messages.push('License expired: grace period ended')
      }
    }
  }
  return status
}

export function ensureFeature(feature: 'teamSpaces' | 'cloudApply', opts?: { dataRoot?: string; licensePath?: string }): { ok: boolean; reason?: string } {
  const st = getStatus(opts)
  if (st.features[feature]) return { ok: true }
  if (st.inGrace) return { ok: true }
  return { ok: false, reason: `feature_locked:${feature}` }
}
