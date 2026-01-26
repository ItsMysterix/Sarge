import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { encryptCredentials, decryptCredentials, maskCredential } from '../lib/credentials'

/**
 * Secrets router
 * 
 * Manages per-environment secrets with:
 * - Version history
 * - Encryption at rest
 * - Masking for display
 * - Audit trail
 */

export const secretsRouter = router({
  // List secrets for an environment (masked for security)
  list: secureProcedure('secrets.list')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT id, key, version, created_at, created_by, updated_at
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND deleted_at IS NULL
           ORDER BY key ASC, version DESC`,
          [input.projectId, input.environmentId]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            console.log('[secrets.list] Table not migrated yet')
            return { rows: [] }
          }
          throw err
        })

        // Group by key, show only latest version with masked value
        const secretsByKey = new Map<string, any>()
        
        for (const row of result?.rows || []) {
          if (!secretsByKey.has(row.key)) {
            secretsByKey.set(row.key, {
              id: row.id,
              key: row.key,
              value: '****', // Always masked in list view
              version: row.version,
              createdAt: row.created_at,
              createdBy: row.created_by,
              updatedAt: row.updated_at,
            })
          }
        }

        return Array.from(secretsByKey.values())
      } catch (err) {
        console.error('[secrets.list] Error:', err)
        return []
      }
    }),

  // Get a specific secret (decrypted, for deployment use)
  get: secureProcedure('secrets.get')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
      key: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT id, key, value_encrypted, version, created_at
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND key = $3 AND deleted_at IS NULL
           ORDER BY version DESC
           LIMIT 1`,
          [input.projectId, input.environmentId, input.key]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            return { rows: [] }
          }
          throw err
        })

        if (!result?.rows?.[0]) {
          throw new Error(`Secret ${input.key} not found`)
        }

        const secret = result.rows[0]
        const decrypted = decryptCredentials(secret.value_encrypted)

        // Log access for audit trail
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('secret.accessed', 'secret', $1, $2, $3, NOW())`,
          [secret.id, (ctx as any).userId || 'system', JSON.stringify({ key: input.key, environment: input.environmentId })]
        ).catch(() => {
          // Audit log optional if table doesn't exist yet
        })

        return {
          id: secret.id,
          key: secret.key,
          value: decrypted,
          version: secret.version,
          createdAt: secret.created_at,
        }
      } catch (err) {
        console.error('[secrets.get] Error:', err)
        throw err
      }
    }),

  // Create or update a secret (creates new version)
  set: secureProcedure('secrets.set')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
      key: z.string().min(1).max(255),
      value: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get current max version
        const versionResult = await ctx.db.query(
          `SELECT COALESCE(MAX(version), 0) as max_version
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND key = $3`,
          [input.projectId, input.environmentId, input.key]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            throw new Error('Secrets table not migrated yet. Run migrations first.')
          }
          throw err
        })

        const nextVersion = (versionResult?.rows?.[0]?.max_version || 0) + 1
        const encrypted = encryptCredentials(input.value)
        const userId = (ctx as any).userId || 'system'

        // Insert new version
        const result = await ctx.db.query(
          `INSERT INTO secrets (project_id, environment_id, key, value_encrypted, version, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id, key, version, created_at`,
          [input.projectId, input.environmentId, input.key, encrypted, nextVersion, userId]
        )

        // Log the change
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('secret.updated', 'secret', $1, $2, $3, NOW())`,
          [result.rows[0].id, userId, JSON.stringify({ key: input.key, environment: input.environmentId, version: nextVersion })]
        ).catch(() => {
          // Audit log optional
        })

        return {
          id: result.rows[0].id,
          key: result.rows[0].key,
          version: result.rows[0].version,
          createdAt: result.rows[0].created_at,
          masked: maskCredential(input.value),
        }
      } catch (err) {
        console.error('[secrets.set] Error:', err)
        throw err
      }
    }),

  // Delete a secret (soft delete - keeps history)
  delete: secureProcedure('secrets.delete')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
      key: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = (ctx as any).userId || 'system'

        // Soft delete all versions of this key
        await ctx.db.query(
          `UPDATE secrets
           SET deleted_at = NOW(), deleted_by = $1
           WHERE project_id = $2 AND environment_id = $3 AND key = $4 AND deleted_at IS NULL`,
          [userId, input.projectId, input.environmentId, input.key]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            throw new Error('Secrets table not migrated yet')
          }
          throw err
        })

        // Log deletion
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('secret.deleted', 'secret', $1, $2, $3, NOW())`,
          ['secret-' + input.key, userId, JSON.stringify({ key: input.key, environment: input.environmentId })]
        ).catch(() => {
          // Audit log optional
        })

        return { success: true }
      } catch (err) {
        console.error('[secrets.delete] Error:', err)
        throw err
      }
    }),

  // Get version history for a secret
  history: secureProcedure('secrets.history')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
      key: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT id, version, created_at, created_by, updated_at
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND key = $3
           ORDER BY version DESC`,
          [input.projectId, input.environmentId, input.key]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        console.error('[secrets.history] Error:', err)
        return []
      }
    }),

  // Rollback to a previous version
  rollback: secureProcedure('secrets.rollback')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
      key: z.string(),
      targetVersion: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = (ctx as any).userId || 'system'

        // Get the target version's encrypted value
        const targetResult = await ctx.db.query(
          `SELECT value_encrypted FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND key = $3 AND version = $4`,
          [input.projectId, input.environmentId, input.key, input.targetVersion]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            throw new Error('Secrets table not migrated yet')
          }
          throw err
        })

        if (!targetResult?.rows?.[0]) {
          throw new Error(`Version ${input.targetVersion} not found`)
        }

        // Get current max version
        const versionResult = await ctx.db.query(
          `SELECT COALESCE(MAX(version), 0) as max_version
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND key = $3`,
          [input.projectId, input.environmentId, input.key]
        )

        const nextVersion = (versionResult?.rows?.[0]?.max_version || 0) + 1

        // Create new version with the old value
        const result = await ctx.db.query(
          `INSERT INTO secrets (project_id, environment_id, key, value_encrypted, version, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id, version`,
          [input.projectId, input.environmentId, input.key, targetResult.rows[0].value_encrypted, nextVersion, userId]
        )

        // Log rollback
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('secret.rolledback', 'secret', $1, $2, $3, NOW())`,
          [result.rows[0].id, userId, JSON.stringify({ key: input.key, from_version: input.targetVersion, to_version: nextVersion })]
        ).catch(() => {})

        return {
          success: true,
          newVersion: result.rows[0].version,
        }
      } catch (err) {
        console.error('[secrets.rollback] Error:', err)
        throw err
      }
    }),

  // Bulk export secrets for deployment (all secrets for an environment)
  exportForDeployment: secureProcedure('secrets.exportForDeployment')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all latest versions
        const result = await ctx.db.query(
          `SELECT DISTINCT ON (key) key, value_encrypted
           FROM secrets
           WHERE project_id = $1 AND environment_id = $2 AND deleted_at IS NULL
           ORDER BY key, version DESC`,
          [input.projectId, input.environmentId]
        ).catch((err: any) => {
          if (err?.message?.includes('secrets')) {
            return { rows: [] }
          }
          throw err
        })

        const secrets: Record<string, string> = {}
        
        for (const row of result?.rows || []) {
          const decrypted = decryptCredentials(row.value_encrypted)
          secrets[row.key] = decrypted
        }

        // Log bulk access
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('secrets.exported', 'environment', $1, $2, $3, NOW())`,
          [input.environmentId, (ctx as any).userId || 'system', JSON.stringify({ projectId: input.projectId, count: Object.keys(secrets).length })]
        ).catch(() => {})

        return secrets
      } catch (err) {
        console.error('[secrets.exportForDeployment] Error:', err)
        return {}
      }
    }),
})
