import type { Pool } from '@neondatabase/serverless'

let ensured = false

/**
 * Ensure minimal backend tables needed for runtime guards exist.
 * Safe to call on every request; guarded by a simple in-process flag.
 */
export async function ensureRateLimitTables(db: Pool) {
  if (ensured) return
  try {
    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS rate_limit_hits (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        route TEXT NOT NULL,
        ts TIMESTAMPTZ NOT NULL
      );
    `)
    await (db as any).query(`CREATE INDEX IF NOT EXISTS idx_rate_hits_key_route_ts ON rate_limit_hits(key, route, ts);`)

    // [CFO F1] Auto-purge rate limit hits older than 24h to prevent storage bloat on Neon free tier
    await (db as any).query(`DELETE FROM rate_limit_hits WHERE ts < NOW() - INTERVAL '24 hours';`)

    // Environment & Platform Tables
    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS environments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- development, staging, production, preview
        region TEXT DEFAULT 'us-east-1',
        resource_config JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        auto_stop BOOLEAN DEFAULT FALSE,
        auto_stop_after_minutes INTEGER,
        cloned_from_id UUID REFERENCES environments(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, name)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        environment_id UUID REFERENCES environments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- web, worker, cron, etc.
        repo_url TEXT NOT NULL,
        branch TEXT NOT NULL,
        build_command TEXT,
        start_command TEXT,
        port INTEGER DEFAULT 8080,
        status TEXT DEFAULT 'stopped',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS secrets (
        id BIGSERIAL PRIMARY KEY,
        environment_id UUID REFERENCES environments(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value_encrypted TEXT,
        provider TEXT,
        version TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(environment_id, key)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS pr_previews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        pr_number INTEGER NOT NULL,
        pr_title TEXT,
        pr_author TEXT,
        branch TEXT NOT NULL,
        commit_sha TEXT NOT NULL,
        preview_url TEXT,
        deployment_id TEXT,
        status TEXT DEFAULT 'pending', -- pending, building, ready, failed, closed
        auto_cleanup BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        closed_at TIMESTAMPTZ,
        UNIQUE(project_id, pr_number)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS environment_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        environment_type TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        resource_config JSONB NOT NULL,
        default_secrets JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, name)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS budget_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL UNIQUE,
        monthly_budget NUMERIC(10,2) NOT NULL,
        alert_thresholds JSONB DEFAULT '[50, 80, 100]',
        notification_channel_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS cost_estimates (
        id BIGSERIAL PRIMARY KEY,
        project_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        monthly_estimate NUMERIC(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        repository_id TEXT,
        framework TEXT,
        detected_framework TEXT,
        detected_package_manager TEXT,
        detected_languages JSONB,
        build_command TEXT,
        dev_command TEXT,
        install_command TEXT,
        auto_deploy BOOLEAN DEFAULT TRUE,
        auto_deploy_branch TEXT DEFAULT 'main',
        preview_deployments BOOLEAN DEFAULT TRUE,
        ai_detected_ports JSONB,
        ai_detected_tools JSONB,
        ai_analysis_summary TEXT,
        ai_analyzed_at TIMESTAMPTZ,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // Ensure description column exists (migration)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS framework TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS repository_id TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_command TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS dev_command TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS install_command TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS output_directory TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS root_directory TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_framework TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_package_manager TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_languages JSONB;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_detected_ports JSONB;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_detected_tools JSONB;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_analysis_summary TEXT;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;`)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info', -- info, success, warning, error
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS project_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'bug', 'feedback'
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'open', -- 'open', 'resolved'
        priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level TEXT NOT NULL, -- 'error', 'warn', 'info'
        source TEXT NOT NULL, -- 'trpc', 'worker', 'auth', 'client'
        message TEXT NOT NULL,
        stack_trace TEXT,
        context JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    ensured = true
  } catch (e) {
    // Don't throw from ensure; callers will gracefully degrade on errors
    try { console.warn('[schema] ensureRateLimitTables failed:', (e as Error).message) } catch { }
  }
}
