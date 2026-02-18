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

    // Auto-purge rate limit hits older than 24h to prevent storage bloat on Neon free tier
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
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_deploy BOOLEAN DEFAULT TRUE;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_deploy_branch TEXT DEFAULT 'main';`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS preview_deployments BOOLEAN DEFAULT TRUE;`)
    await (db as any).query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`)

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

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id BIGSERIAL PRIMARY KEY,
        project_id TEXT NOT NULL,
        service_name TEXT,
        cpu_usage NUMERIC(5,2),
        memory_usage NUMERIC(10,2),
        latency_ms INTEGER,
        "timestamp" TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        theme_mode TEXT DEFAULT 'system',
        enable_animations BOOLEAN DEFAULT TRUE,
        notifications JSONB DEFAULT '{}',
        slack_alerts BOOLEAN DEFAULT FALSE,
        auto_rebuild BOOLEAN DEFAULT FALSE,
        default_region TEXT DEFAULT 'us-east-1',
        default_environment TEXT DEFAULT 'development',
        resources JSONB DEFAULT '{"cpu": 0.5, "memory": 512, "replicas": 1}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS notification_channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config JSONB NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS alert_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        rule_type TEXT NOT NULL,
        events JSONB DEFAULT '[]',
        condition JSONB NOT NULL,
        severity TEXT NOT NULL,
        notification_channels JSONB DEFAULT '[]',
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS alert_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
        triggered_at TIMESTAMPTZ DEFAULT NOW(),
        value NUMERIC,
        message TEXT,
        status TEXT DEFAULT 'firing',
        resolved_at TIMESTAMPTZ
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS custom_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        hostname TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        verified_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        UNIQUE(hostname)
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        branch TEXT NOT NULL,
        commit TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        summary TEXT,
        services JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
        step TEXT,
        type TEXT,
        message TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS deployment_rollbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
        previous_deployment_id UUID REFERENCES deployments(id),
        reason TEXT,
        triggered_by TEXT,
        status TEXT DEFAULT 'in-progress',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS stacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'stopped',
        services JSONB DEFAULT '[]',
        environment JSONB DEFAULT '{}',
        resource_usage JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS stack_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT,
        status TEXT,
        port INTEGER,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS stack_deployments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
        status TEXT,
        summary TEXT,
        deployed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    // Ensure cost_estimates has all needed columns
    await (db as any).query(`ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS environment_id TEXT;`)
    await (db as any).query(`ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS deployment_id UUID;`)
    await (db as any).query(`ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,4);`)
    await (db as any).query(`ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}';`)
    await (db as any).query(`ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();`)

    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS connected_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_slug TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'disconnected',
        connected_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_slug, provider_id)
      );
    `)

    ensured = true
  } catch (e) {
    // Don't throw from ensure; callers will gracefully degrade on errors
    try { console.warn('[schema] ensureRateLimitTables failed:', (e as Error).message) } catch { }
  }
}
