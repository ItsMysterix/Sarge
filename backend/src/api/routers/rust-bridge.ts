import { z } from 'zod';
import { router } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { rustBridge } from '../../services/rust-bridge';
import { jobs } from '../lib/drizzle-schema';

export const rustBridgeRouter = router({
    scan: secureProcedure('rust.scan')
        .input(z.object({ target: z.string() }))
        .mutation(async ({ input }) => {
            return await rustBridge.scanVulnerabilities(input.target);
        }),

    enqueueScan: secureProcedure('rust.enqueueScan')
        .input(z.object({ target: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [job] = await ctx.drizzleDb.insert(jobs).values({
                type: 'repo_scan',
                payload: { target: input.target },
                userId: ctx.session?.user?.id || 'system',
                status: 'pending'
            }).returning({ id: jobs.id });

            // In a real production environment with BullMQ/Redis:
            // await scanQueue.add('scan', { jobId: job.id, target: input.target });

            return { jobId: job.id };
        }),

    generateIaC: secureProcedure('rust.generateIaC')
        .input(z.object({
            target: z.enum(['kubernetes', 'terraform']),
            service: z.any()
        }))
        .mutation(async ({ input }) => {
            return await rustBridge.generateIaC(input.target, input.service);
        }),

    enforceRbac: secureProcedure('rust.enforceRbac')
        .input(z.object({
            userId: z.string(),
            resource: z.any(),
            action: z.any()
        }))
        .query(async ({ input }) => {
            return await rustBridge.enforceRbac(input.userId, input.resource, input.action);
        }),

    getSecret: secureProcedure('rust.getSecret', { requiresRole: 'admin' })
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
            return await rustBridge.getSecret(input.key);
        }),

    setSecret: secureProcedure('rust.setSecret', { requiresRole: 'admin' })
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
            return await rustBridge.setSecret(input.key, input.value);
        }),

    resolveGtm: secureProcedure('rust.resolveGtm')
        .input(z.any())
        .query(async ({ input }) => {
            return await rustBridge.resolveGtm(input);
        }),

    planRemediation: secureProcedure('rust.planRemediation')
        .input(z.any())
        .mutation(async ({ input }) => {
            return await rustBridge.planRemediation(input);
        }),
});
