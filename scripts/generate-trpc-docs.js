/*
  Generates docs/api/trpc.md by scanning backend router source files.
  Run with: npm run docs:trpc
*/
const fs = require('node:fs')
const path = require('node:path')

function extractProceduresFromFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const routerMatch = src.match(/export\s+const\s+(\w+)Router\s*=\s*router\s*\(/)
  if (!routerMatch) return []
  const routerName = routerMatch[1]
  // Narrow to the object literal inside router({ ... }) to avoid false positives
  const start = src.indexOf('router(', routerMatch.index)
  const objStart = src.indexOf('{', start)
  let depth = 0
  let end = objStart
  for (let i = objStart; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  const body = src.slice(objStart + 1, end)
  // Find entries of the form: name: secureProcedure(...).(query|mutation|subscription)(
  const entries = []
  const regex = /^\s*(\w+)\s*:\s*[\s\S]*?\.(query|mutation|subscription)\s*\(/gm
  let m
  while ((m = regex.exec(body)) !== null) {
    const name = m[1]
    const type = m[2]
    // Capture input object literal from .input(z.object({ ... })) if present
    let inputMd = 'opaque'
  const propStartIdx = m.index
  const nextPropRe = /\n\s*\w+\s*:/g
  nextPropRe.lastIndex = propStartIdx + 1
  const nextMatch = nextPropRe.exec(body)
  const propEndIdx = nextMatch ? nextMatch.index : propStartIdx + 1000
  const block = body.slice(propStartIdx, propEndIdx)
    const inputMatch = block.match(/input\s*\(\s*z\.object\s*\(\s*\{([\s\S]*?)\}\s*\)\s*\)/)
    if (inputMatch) {
      inputMd = '```ts\n{\n' + inputMatch[1].trim() + '\n}\n```'
    }
    entries.push({ router: routerName, name, type, inputMd, notes: type === 'subscription' ? 'Emits event frames; payload varies by topic.' : '' })
  }
  return entries
}

function generateMarkdown() {
  const routersDir = path.join(process.cwd(), 'backend', 'src', 'api', 'routers')
  const files = fs.readdirSync(routersDir).filter(f => f.endsWith('.ts'))
  const rows = files.flatMap(f => extractProceduresFromFile(path.join(routersDir, f)))
  const byRouter = new Map()
  for (const r of rows) {
    const arr = byRouter.get(r.router) ?? []
    arr.push(r)
    byRouter.set(r.router, arr)
  }

  let md = ''
  md += '# tRPC API Reference\n\n'
  md += 'This document is auto-generated from the source routers. Do not edit by hand.\n\n'

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
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
}

module.exports = { generateMarkdown }
