import { router } from "../../trpc"
import { secureProcedure } from "../trpc/middlewares/security"
import { z } from "zod"
import * as path from 'path'

function getDataRoot() {
  // On Vercel/serverless, use /tmp (only writable location)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', '.sarge')
  }
  const base = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

async function getCore(): Promise<any> {
  try {
    // Prefer require in case a CJS shim exists during tests
    const modName = ['sarge','-','core'].join('')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(modName)
  } catch (e: any) {
    if ((globalThis as any).__sargeCoreMock) return (globalThis as any).__sargeCoreMock
    if (e?.code === 'ERR_REQUIRE_ESM') {
      const modName = ['sarge','-','core'].join('')
      const mod = await import(modName)
      return mod
    }
    throw e
  }
}

export const tracesRouter = router({
  list: secureProcedure('traces.list').query(async () => {
    const core = await getCore()
    const dataRoot = getDataRoot()
    const items = core.traces.listTraces(dataRoot, 50)
    return { items }
  }),
  get: secureProcedure('traces.get').input(z.object({ traceId: z.string().min(1) })).query(async ({ input }) => {
    const core = await getCore()
    const dataRoot = getDataRoot()
    const detail = core.traces.getTrace(dataRoot, input.traceId)
    if (!detail) return { found: false as const }
    return { found: true as const, detail }
  }),
})

export type TracesRouter = typeof tracesRouter
