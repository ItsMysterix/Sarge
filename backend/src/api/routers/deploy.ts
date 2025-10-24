import { router, publicProcedure } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { z } from 'zod';
import createBufferedSubscription from '../lib/realtime';
import { startQueryTimer } from '../../metrics/exporter';
import { observable } from '@trpc/server/observable';
import { topicAll, topicOne } from '../lib/deployEmit';

export const deployRouter = router({
  create: secureProcedure('deploy.create')
    .input(z.object({
      branch: z.string().default("main"),
      commit: z.string().optional(),
      summary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const end = startQueryTimer('deploy.create');
      const commit = input.commit ?? null;
      const summary = input.summary ?? `Deployment from ${input.branch}`;

      const result = await ctx.db.query(
        `INSERT INTO deployments (branch, commit, status, summary, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [input.branch, commit, "pending", summary]
      )
      end();

      const deployment = result.rows[0]
      // enqueue real work for executor; subscribers will receive updates via deploys:update
      if (deployment?.id != null) {
        ctx.ee.emit("deploys:enqueue", { id: deployment.id })
      }
      return deployment
    }),
  
  getDeployments: secureProcedure('deploy.get').query(async ({ ctx }) => {
  const result = await ctx.db.query(
    `SELECT * FROM deployments ORDER BY created_at DESC LIMIT 50`
  )
  return result.rows
}),

  subscribe: secureProcedure('deploy.subscribe')
    .input(z.object({ deploymentId: z.string().optional() }).optional())
    .subscription(({ ctx, input }) => {
      const id = input?.deploymentId;
      return observable<any>((emit) => {
        // Emit a one-time ready frame
        emit.next({ type: 'ready', id: id ?? '*' });
        const subFactory = createBufferedSubscription(ctx.ee, {
          topics: id ? [topicOne(id)] : [topicAll],
          perTickCap: 100,
          bufferSize: 50,
          predicate: id ? (ev) => ev?.id === id : undefined,
        });
        const inner = subFactory();
        const subscription = (inner as any).subscribe({
          next: (v: any) => emit.next(v),
          error: (e: any) => emit.error(e),
          complete: () => emit.complete(),
        });
        return () => subscription.unsubscribe?.();
      });
    }),
})
