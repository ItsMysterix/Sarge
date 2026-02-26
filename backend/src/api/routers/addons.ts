import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { apiLogger } from '../../lib/logger'
import { TRPCError } from '@trpc/server'

/**
 * Addons Router - Manages Marketplace Addons via Nango Connected Providers
 */
export const addonsRouter = router({

    // List available addons in the marketplace
    listAvailable: secureProcedure('addons.listAvailable')
        .query(async () => {
            return [
                { id: 'redis', name: 'Redis Cache', description: 'In-memory data structure store', icon: 'Database' },
                { id: 'postgresql', name: 'PostgreSQL Server', description: 'Powerful, open source object-relational database', icon: 'Database' },
                { id: 'rabbitmq', name: 'RabbitMQ', description: 'Reliable message broker', icon: 'MessageSquare' },
                { id: 'minio', name: 'MinIO Object Storage', description: 'S3 compatible high-performance object storage', icon: 'Box' },
                { id: 'meilisearch', name: 'Meilisearch', description: 'Lightning-fast search engine', icon: 'Search' },
            ];
        }),

    // Deploy an addon to the user's connected BYOC via Nango
    provisionAddon: secureProcedure('addons.provisionAddon')
        .input(z.object({
            projectId: z.string(),
            addonId: z.string(),
            providerId: z.string().default('aws'),
        }))
        .mutation(async ({ ctx, input }) => {
            apiLogger.info({ input }, '[Addons] Provisioning Addon');

            try {
                const { Nango } = await import('@nangohq/node');
                const nangoSecretKey = process.env.NANGO_SECRET_KEY;

                if (!nangoSecretKey) {
                    throw new Error('NANGO_SECRET_KEY is missing');
                }

                const nango = new Nango({ secretKey: nangoSecretKey });
                const connection = await nango.getConnection(input.providerId, (ctx as any).userId);

                if (!connection) {
                    throw new TRPCError({
                        code: 'PRECONDITION_FAILED',
                        message: `Please connect your ${input.providerId} account via Nango in Settings first.`
                    });
                }

                // Logic to dynamically generate Helm/Terraform manifests and provision 
                // using the fresh Nango OAuth token for AWS/GCP/DO
                apiLogger.info(`[Addons] Successfully authenticated with ${input.providerId} via Nango`);

                // Mock provision completion
                return {
                    success: true,
                    message: `${input.addonId} has been successfully queued for provisioning on ${input.providerId}.`,
                    addonId: input.addonId
                };
            } catch (error: any) {
                apiLogger.error({ error }, '[Addons] Provisioning Error');
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to provision addon'
                });
            }
        }),
});
