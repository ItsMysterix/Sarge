import { t } from '../../lib/trpc'

/**
 * Audit Logging Middleware
 * 
 * Automatically records every mutation call in the audit_logs table.
 * Essential for SOC2 compliance and developer accountability.
 */
export const auditLoggingMiddleware = t.middleware(async ({ ctx, next, path, type, input }) => {
    const result = await next();

    // Only audit mutations (state-changing actions)
    if (type === 'mutation') {
        try {
            // In NextAuth ctx.session?.user?.id is where we'd get the user
            // Supporting both session and potential system/token auth
            const userId = (ctx as any).session?.user?.id || (ctx as any).userId || 'system';

            console.log(`[Audit] Logging mutation: ${path} by user: ${userId}`);

            await ctx.db.query(
                `INSERT INTO audit_logs (user_id, action, resource_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
                [userId, path, 'api', JSON.stringify(input || {})]
            ).catch(err => {
                console.error('[Audit] Failed to write log:', err);
            });
        } catch (e) {
            console.error('[Audit] Middleware error:', e);
        }
    }

    return result;
});
