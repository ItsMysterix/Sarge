import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { rustBridge } from '../../services/rust-bridge';

export const rustBridgeRouter = createTRPCRouter({
    scan: publicProcedure
        .input(z.object({ target: z.string() }))
        .mutation(async ({ input }) => {
            return await rustBridge.scanVulnerabilities(input.target);
        }),

    generateIaC: publicProcedure
        .input(z.object({
            target: z.enum(['kubernetes', 'terraform']),
            service: z.any()
        }))
        .mutation(async ({ input }) => {
            return await rustBridge.generateIaC(input.target, input.service);
        }),

    enforceRbac: publicProcedure
        .input(z.object({
            userId: z.string(),
            resource: z.any(),
            action: z.any()
        }))
        .query(async ({ input }) => {
            return await rustBridge.enforceRbac(input.userId, input.resource, input.action);
        }),

    getSecret: publicProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
            return await rustBridge.getSecret(input.key);
        }),

    setSecret: publicProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
            return await rustBridge.setSecret(input.key, input.value);
        }),

    resolveGtm: publicProcedure
        .input(z.any())
        .query(async ({ input }) => {
            return await rustBridge.resolveGtm(input);
        }),

    planRemediation: publicProcedure
        .input(z.any())
        .mutation(async ({ input }) => {
            return await rustBridge.planRemediation(input);
        }),
});
