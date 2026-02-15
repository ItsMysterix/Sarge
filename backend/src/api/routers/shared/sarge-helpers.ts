/**
 * Shared Sarge-Core Helpers
 * 
 * Common utilities used across oneclick, sarge, and traces routers:
 * - getCore(): Dynamic import of sarge-core with CJS/ESM fallback
 * - getDataRoot(): Determine writable data directory (serverless-aware)
 * - saveLogs(): Persist deployment logs to database
 */

/**
 * Dynamically import sarge-core at runtime.
 * Uses non-literal module name to prevent webpack static resolution during Next.js build.
 * Falls back to dynamic import() if the module is ESM-only.
 */
export async function getCore(): Promise<any> {
    const modName = ['sarge', '-', 'core'].join('')
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(modName)
    } catch (e: any) {
        if (e?.code === 'ERR_REQUIRE_ESM') {
            const mod = await import(modName)
            return mod
        }
        throw e
    }
}

/**
 * Determine the writable data root directory.
 * On Vercel/Lambda: /tmp/.sarge (only writable location)
 * Otherwise: SARGE_DATA_DIR env var or data/sarge/workspaces/default
 */
export function getDataRoot(): string {
    const pathMod = require('path')
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return pathMod.join('/tmp', '.sarge')
    }
    const base = process.env.SARGE_DATA_DIR
        ? pathMod.resolve(process.cwd(), process.env.SARGE_DATA_DIR)
        : pathMod.resolve(process.cwd(), 'data/sarge/workspaces/default')
    return base
}

/**
 * Save deployment logs to the database.
 * Handles schema differences (service_id vs service column).
 */
export async function saveLogs(
    logs: Array<{ type: string; message: string; service: string; severity?: string; timestamp?: string }>
) {
    try {
        const { db } = await import('../../lib/db')

        for (const log of logs) {
            try {
                await db.query(
                    `INSERT INTO logs (type, message, service_id, timestamp, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [log.type, log.message, log.service, log.timestamp || new Date().toISOString(), log.severity || 'info']
                ).catch(async (err) => {
                    if (err?.message?.includes('service_id')) {
                        await db.query(
                            `INSERT INTO logs (type, message, service, timestamp, severity, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
                            [log.type, log.message, log.service, log.timestamp || new Date().toISOString(), log.severity || 'info']
                        )
                    } else {
                        throw err
                    }
                })
            } catch (logErr) {
                console.error('[saveLogs] Failed to insert log:', logErr)
            }
        }

        console.log('[saveLogs] Successfully saved', logs.length, 'log(s) to database')
    } catch (err) {
        console.error('[saveLogs] Database error:', err)
    }
}
