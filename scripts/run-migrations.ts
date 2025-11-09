/**
 * Deprecated migration runner.
 *
 * The canonical migration script now lives at: backend/scripts/migrate.ts
 * and is invoked via `npm run db:migrate` (see backend/package.json).
 *
 * This stub remains temporarily to avoid breaking existing docs / scripts
 * that might reference `scripts/run-migrations.ts`. It intentionally exits
 * with a clear message so nobody accidentally applies migrations twice.
 */

console.warn('[DEPRECATED] Use `npm run db:migrate` (backend/scripts/migrate.ts) instead of scripts/run-migrations.ts');
process.exit(0);
