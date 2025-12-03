import { z } from 'zod'
import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import createBufferedSubscription from '../lib/realtime'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'

interface TerminalSession {
  id: string
  topic: string
  proc: ReturnType<typeof spawn>
  startedAt: number
}

const sessions = new Map<string, TerminalSession>()
const ALLOWED_COMMAND = ['npm', ['run','dev']]

function startDevProcess(): TerminalSession {
  // Reuse existing session if running
  for (const s of sessions.values()) {
    if (!s.proc.killed) return s
  }
  const id = randomUUID()
  const topic = `terminal:dev:${id}`
  const proc = spawn(ALLOWED_COMMAND[0] as string, ALLOWED_COMMAND[1] as string[], {
    cwd: process.cwd(),
    env: { ...process.env },
    shell: false,
  })
  const session: TerminalSession = { id, topic, proc, startedAt: Date.now() }
  sessions.set(id, session)
  return session
}

export const terminalRouter = router({
  startDevSession: secureProcedure('terminal.startDevSession')
    .input(z.void())
    .mutation(({ ctx }) => {
      const session = startDevProcess()
      // Attach listeners once
      if ((session as any)._listenersAttached) return { sessionId: session.id, topic: session.topic };
      (session as any)._listenersAttached = true;
      const emit = (line: string, level: string = 'info') => {
        try { ctx.ee.emit(session.topic, { ts: Date.now(), line, level }); } catch {}
      };
      emit(`Starting dev session (id=${session.id})`, 'progress');
      if (session.proc.stdout) {
        session.proc.stdout.on('data', (buf: any) => {
          buf.toString().split(/\r?\n/).filter(Boolean).forEach((l: any) => emit(l));
        });
      }
      if (session.proc.stderr) {
        session.proc.stderr.on('data', (buf: any) => {
          buf.toString().split(/\r?\n/).filter(Boolean).forEach((l: any) => emit(l, 'error'));
        });
      }
      session.proc.on('close', (code: any) => {
        emit(`Dev process exited with code ${code}`, 'success');
      });
      return { sessionId: session.id, topic: session.topic };
    }),
  streamSession: secureProcedure('terminal.streamSession')
    .input(z.object({ sessionId: z.string() }))
    .subscription(({ input, ctx }) => {
      const session = sessions.get(input.sessionId)
      if (!session) {
        // ephemeral topic to send not-found message
        const nfTopic = `terminal:notfound:${input.sessionId}`
        ctx.ee.emit(nfTopic, { ts: Date.now(), line: 'Session not found', level: 'error' })
        return createBufferedSubscription(ctx.ee, { topics: [nfTopic], bufferSize: 10 })()
      }
      return createBufferedSubscription(ctx.ee, { topics: [session.topic], bufferSize: 500, perTickCap: 50 })()
    })
})
