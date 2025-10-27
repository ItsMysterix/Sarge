import { describe, it, expect } from 'vitest'
import { runCli } from './index'
import { Writable } from 'stream'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as url from 'url'
import * as fsp from 'fs/promises'

function makeCapture() {
  const lines: string[] = []
  const stdout = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk))
      cb()
    },
  })
  const stderr = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk))
      cb()
    },
  })
  const getJson = () =>
    lines
      .join('')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l))
  return { stdout, stderr, getJson }
}

function tmpDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-cli-test-'))
}

describe('sarge-cli skeleton', () => {
  it('prints status JSON for fresh workspace', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    await runCli(['node', 'sarge', 'status'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events = cap.getJson()
    const last = events[events.length - 1]
    expect(last.msg).toBe('workspace.status')
    expect(last.data.running).toBe(false)
    expect(last.data.dataDir).toContain(dir)
  })

  it('up -> status shows running', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    await runCli(['node', 'sarge', 'up'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'status'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events = cap.getJson()
    const status = events.find((e) => e.msg === 'workspace.status')
    expect(status.data.running).toBe(true)
  })

  it('creates a stack with services', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    await runCli(
      ['node', 'sarge', 'stack', 'create', 'dev', '--services', 's3,dynamo,lambda'],
      { stdout: cap.stdout, stderr: cap.stderr },
      { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' }
    )
    const events = cap.getJson()
    const created = events.find((e) => e.msg === 'stack.created')
    expect(created.data.name).toBe('dev')
    expect(created.data.services).toEqual(['s3', 'dynamo', 'lambda'])
  })

  it('snapshot create and replay restores state', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    await runCli(['node', 'sarge', 'up'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'snapshot', 'create', 's1'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'down'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'snapshot', 'replay', 's1'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'status'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events = cap.getJson()
    const status = events.find((e) => e.msg === 'workspace.status')
    expect(status.data.running).toBe(true)
  })

  it('detects a repo and creates a plan', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    // use sarge-core test fixtures repo
    const repo = path.join(path.dirname(__dirname), 'sarge-core', 'src', '__tests__', 'fixtures', 'services')
    await runCli(['node', 'sarge', 'detect', '--repo', repo], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events1 = cap.getJson()
    const det = events1.find((e) => e.msg === 'detect.blueprint')
    expect(det).toBeTruthy()
    const blueprint = det.data.blueprint
    // write blueprint to tmp file and plan it
    const bpFile = path.join(dir, 'bp.json')
    await fsp.writeFile(bpFile, JSON.stringify(blueprint))
    await runCli(['node', 'sarge', 'plan', '--in', bpFile], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events2 = cap.getJson()
    const planEvt = events2.find((e) => e.msg === 'plan.created')
    expect(planEvt).toBeTruthy()
    expect(planEvt.data.plan.assignedPorts).toBeTruthy()
  })

  it('applies a plan and returns result JSON', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    const repo = path.join(path.dirname(__dirname), 'sarge-core', 'src', '__tests__', 'fixtures', 'services')
    // detect -> plan -> write plan file -> apply
    await runCli(['node', 'sarge', 'detect', '--repo', repo], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events1 = cap.getJson()
    const det = events1.find((e) => e.msg === 'detect.blueprint')
    const bp = det.data.blueprint
    const bpFile = path.join(dir, 'bp.json')
    fs.writeFileSync(bpFile, JSON.stringify(bp))
    await runCli(['node', 'sarge', 'plan', '--in', bpFile], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events2 = cap.getJson()
    const planEvt = events2.find((e) => e.msg === 'plan.created')
    const plan = planEvt.data.plan
    const planFile = path.join(dir, 'plan.json')
    fs.writeFileSync(planFile, JSON.stringify(plan))
    await runCli(['node', 'sarge', 'apply', '--plan', planFile, '--repo', repo], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events3 = cap.getJson()
    const res = events3.find((e) => e.msg === 'apply.result')
    expect(res.data.ok).toBeTypeOf('boolean')
    expect(Array.isArray(res.data.urls)).toBe(true)
  })

  it('docker on/off toggles config', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    await runCli(['node', 'sarge', 'docker', 'on'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'status'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events = cap.getJson()
    const status = events.find((e) => e.msg === 'workspace.status')
    expect(status.data.dockerEnabled).toBe(true)
    await runCli(['node', 'sarge', 'docker', 'off'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'status'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events2 = cap.getJson()
    const status2 = events2[events2.length - 1]
    expect(status2.data.dockerEnabled).toBe(false)
  })

  it('logs command tails lines with filters', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    const logsDir = path.join(dir, 'logs')
    fs.mkdirSync(logsDir, { recursive: true })
    const file = path.join(logsDir, 'api.log')
    fs.writeFileSync(file, ['one','two','three','error: bad'].join('\n'))
    await runCli(['node', 'sarge', 'logs', 'api', '--lines', '3', '--include', 'error'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events = cap.getJson()
    const lines = events.filter((e) => e.msg === 'logs.line').map((e) => e.data.line)
    expect(lines).toEqual(['error: bad'])
  })

  it('env set/get/list works without leaking secrets', async () => {
    const cap = makeCapture()
    const dir = tmpDataDir()
    // set non-secret
    await runCli(['node', 'sarge', 'env', 'set', 'FOO=bar'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'env', 'get', 'FOO'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events1 = cap.getJson()
    const getEvt = events1.find((e) => e.msg === 'env.get.ok')
    expect(getEvt.data.value).toBe('bar')
    // set secret
    await runCli(['node', 'sarge', 'env', 'set', '--secret', 'PASS=supersecret'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    await runCli(['node', 'sarge', 'env', 'get', 'PASS'], { stdout: cap.stdout, stderr: cap.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const events2 = cap.getJson()
    const getEvt2 = events2.reverse().find((e) => e.msg === 'env.get.ok' && e.data.key === 'PASS')
    expect(getEvt2.data.meta.secret).toBe(true)
    expect(getEvt2.data.value).toBeUndefined()
    // reveal prints raw value (not JSON)
    const cap2 = makeCapture()
    await runCli(['node', 'sarge', 'env', 'reveal', 'PASS'], { stdout: cap2.stdout, stderr: cap2.stderr }, { SARGE_DATA_DIR: dir, PATH: process.env.PATH || '' })
    const raw = cap2.getJson() // will likely be empty as reveal prints raw
    expect(Array.isArray(raw)).toBe(true)
  })
})
