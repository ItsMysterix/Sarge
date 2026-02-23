import { TRPCError } from '@trpc/server';
import { db } from './db';

/**
 * Ensures the user has access to a specific project.
 * Throws TRPCError if access is denied.
 */
export async function ensureProjectOwnership(userId: string | undefined, projectId: string) {
    if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const result = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, userId]
    );

    if (result.rows.length === 0) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this project',
        });
    }

    return true;
}

/**
 * Ensures the user has access to a project by its slug.
 */
export async function ensureProjectOwnershipBySlug(userId: string | undefined, slug: string) {
    if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const result = await db.query(
        'SELECT id FROM projects WHERE slug = $1 AND user_id = $2',
        [slug, userId]
    );

    if (result.rows.length === 0) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this project',
        });
    }

    return result.rows[0].id; // Return UUID for further queries
}

/**
 * Ensures the user owns the project associated with a deployment.
 */
export async function ensureDeploymentOwnership(userId: string | undefined, deploymentId: string) {
    if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const result = await db.query(
        `SELECT d.id FROM deployments d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [deploymentId, userId]
    );

    if (result.rows.length === 0) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this deployment',
        });
    }

    return true;
}
