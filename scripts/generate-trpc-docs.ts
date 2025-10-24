/*
  Generates docs/api/trpc.md by introspecting the backend appRouter.
  Run with: npm run docs:trpc
*/

const fs = require('node:fs') as typeof import('node:fs')
const path = require('node:path') as typeof import('node:path')
import type { ZodTypeAny } from 'zod'
const { z } = require('zod') as typeof import('zod')

// Import the live router (no servers spun up)
const { appRouter } = require('../backend/src/api/root')

function isRouter(node: any): boolean {
  return !!node && !!node._def && !!node._def.records
}

function isProcedure(node: any): boolean {
  return !!node && !!node._def && typeof node._def.type === 'string'
}

function getProcedureType(proc: any): 'query' | 'mutation' | 'subscription' | 'unknown' {
  const t = proc?._def?.type
  if (t === 'query' || t === 'mutation' || t === 'subscription') return t
  return 'unknown'
}

function tryZodToMd(schema: ZodTypeAny | undefined): string {
  if (!schema) return 'opaque'
  try {
    return '```\n' + describeZod(schema) + '\n```'
  } catch {
    try {
      const parsed = (schema as any)?._def?.description
      if (parsed) return String(parsed)
    } catch {}
    return 'opaque'
  }
}

function describeZod(schema: ZodTypeAny, indent = 0): string {
  const pad = ' '.repeat(indent)
  const def: any = (schema as any)?._def
  const typeName: string = def?.typeName || 'ZodType'
  switch (typeName) {
    case 'ZodObject': {
      const shape = def.shape()
      let out = '{\n'
      for (const [k, v] of Object.entries(shape)) {
        out += pad + '  ' + k + ': ' + summarize(v as any, indent + 2) + '\n'
      }
      out += pad + '}'
      return out
    }
    case 'ZodArray':
      return '[' + summarize(def.type, indent) + ']'
    case 'ZodString':
      return 'string'
    case 'ZodNumber':
      return 'number'
    case 'ZodBoolean':
      return 'boolean'
    case 'ZodLiteral':
      return JSON.stringify(def.value)
    case 'ZodEnum':
      return 'enum(' + def.values.join(', ') + ')'
    case 'ZodUnion':
      return def.options.map((o: any) => summarize(o, indent)).join(' | ')
    case 'ZodOptional':
      return summarize(def.innerType, indent) + ' (optional)'
    case 'ZodNullable':
      return summarize(def.innerType, indent) + ' | null'
    case 'ZodDefault':
      return summarize(def.innerType, indent) + ` (default=${JSON.stringify(def.defaultValue())})`
    case 'ZodAny':
      return 'any'
    case 'ZodUnknown':
      return 'unknown'
    default:
      return typeName
  }
}

function summarize(s: any, indent = 0): string {
  try { return describeZod(s as any, indent) } catch { return 'opaque' }
}

function getInputSchema(proc: any): ZodTypeAny | undefined {
  try {
    const inputs: any[] = proc?._def?.inputs
    if (Array.isArray(inputs) && inputs.length > 0) {
      const first = inputs[0]
      // unwrap middleware input if needed
      if (first && typeof first === 'object' && 'type' in first && first.type === 'transform') {
        return (first as any).schema as ZodTypeAny
      }
      return first as ZodTypeAny
    }
  } catch {}
  return undefined
}

function collect(router: any, basePath: string[] = []) {
  const out: Array<{
    router: string
    name: string
    type: string
    inputMd: string
    notes?: string
  }> = []

  const records = router._def.records
  for (const [key, node] of Object.entries(records)) {
    if (isRouter(node)) {
      out.push(...collect(node, [...basePath, key]))
      continue
    }
    if (isProcedure(node)) {
      const type = getProcedureType(node)
      const input = getInputSchema(node)
      const inputMd = tryZodToMd(input)
      const routerName = basePath[0] ?? '(root)'
      const name = [...basePath.slice(1), key].filter(Boolean).join('.') || key
      out.push({ router: routerName, name, type, inputMd, notes: type === 'subscription' ? 'Emits event frames; payload varies by topic.' : undefined })
    }
  }
  return out
}

function generateMarkdown(): string {
  const rows = collect(appRouter as any)
  const byRouter = new Map<string, typeof rows>()
  for (const r of rows) {
    const arr = byRouter.get(r.router) ?? []
    arr.push(r)
    byRouter.set(r.router, arr)
  }

  let md = ''
  md += '# tRPC API Reference\n\n'
  md += 'This document is auto-generated from the live router. Do not edit by hand.\n\n'

  for (const [routerName, list] of byRouter.entries()) {
    md += `## Router: ${routerName}\n\n`
    md += '| Procedure | Type | Input | Notes |\n'
    md += '|---|---|---|---|\n'
    for (const item of list) {
      const inputCollapsed = item.inputMd.includes('```') ? '\n' + item.inputMd + '\n' : item.inputMd
      md += `| ${item.name} | ${item.type} | ${inputCollapsed.replace(/\n/g, '<br/>')} | ${item.notes ?? ''} |\n`
    }
    md += '\n'
  }
  return md
}

if (require.main === module) {
  const md = generateMarkdown()
  const outDir = path.join(process.cwd(), 'docs', 'api')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'trpc.md')
  fs.writeFileSync(outPath, md)
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
}

module.exports = { generateMarkdown }
