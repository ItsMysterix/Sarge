import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
    jsonb,
    integer,
    numeric,
    bigserial,
    unique,
    primaryKey,
    type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- Auth & Users ---

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull().unique(),
    image: text('image'),
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- Infrastructure ---

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    repositoryId: text('repository_id'),
    framework: text('framework'),
    detectedFramework: text('detected_framework'),
    detectedPackageManager: text('detected_package_manager'),
    detectedLanguages: jsonb('detected_languages'),
    buildCommand: text('build_command'),
    devCommand: text('dev_command'),
    installCommand: text('install_command'),
    autoDeploy: boolean('auto_deploy').default(true),
    autoDeployBranch: text('auto_deploy_branch').default('main'),
    previewDeployments: boolean('preview_deployments').default(true),
    aiDetectedPorts: jsonb('ai_detected_ports'),
    aiDetectedTools: jsonb('ai_detected_tools'),
    aiAnalysisSummary: text('ai_analysis_summary'),
    aiAnalyzedAt: timestamp('ai_analyzed_at', { withTimezone: true }),
    status: text('status').default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const environments = pgTable('environments', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('project_id').notNull(),
    providerId: text('provider_id').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // development, staging, production, preview
    region: text('region').default('us-east-1'),
    resourceConfig: jsonb('resource_config').default({}),
    status: text('status').notNull().default('active'),
    autoStop: boolean('auto_stop').default(false),
    autoStopAfterMinutes: integer('auto_stop_after_minutes'),
    clonedFromId: uuid('cloned_from_id').references((): AnyPgColumn => environments.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.projectId, t.name),
}));

export const services = pgTable('services', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    environmentId: uuid('environment_id').references(() => environments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // web, worker, cron, etc.
    repoUrl: text('repo_url').notNull(),
    branch: text('branch').notNull(),
    buildCommand: text('build_command'),
    startCommand: text('start_command'),
    port: integer('port').default(8080),
    status: text('status').default('stopped'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- Settings & Persistence ---

export const userSettings = pgTable('user_settings', {
    userId: text('user_id').primaryKey(),
    themeMode: text('theme_mode').default('system'),
    enableAnimations: boolean('enable_animations').default(true),
    notifications: jsonb('notifications').default({}),
    slackAlerts: boolean('slack_alerts').default(false),
    autoRebuild: boolean('auto_rebuild').default(false),
    defaultRegion: text('default_region').default('us-east-1'),
    defaultEnvironment: text('default_environment').default('development'),
    resources: jsonb('resources').default({ cpu: 0.5, memory: 512, replicas: 1 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const projectMembers = pgTable('project_members', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.projectId, t.userId),
}));

export const connectedProviders = pgTable('connected_providers', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectSlug: text('project_slug').notNull(),
    providerId: text('provider_id').notNull(),
    status: text('status').notNull().default('disconnected'),
    credentials: jsonb('credentials').default({}),
    connectedAt: timestamp('connected_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.projectSlug, t.providerId),
}));

// --- Monitoring & Comms ---

export const notificationChannels = pgTable('notification_channels', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    config: jsonb('config').notNull(),
    enabled: boolean('enabled').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const metrics = pgTable('metrics', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    projectId: text('project_id').notNull(),
    serviceName: text('service_name'),
    cpuUsage: numeric('cpu_usage', { precision: 5, scale: 2 }),
    memoryUsage: numeric('memory_usage', { precision: 10, scale: 2 }),
    latencyMs: integer('latency_ms'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
});

export const customDomains = pgTable('custom_domains', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    hostname: text('hostname').notNull().unique(),
    status: text('status').notNull().default('pending'),
    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// --- Auth.js / NextAuth & Verification ---

export const accounts = pgTable('accounts', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::TEXT`),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
}, (t) => ({
    unq: unique().on(t.provider, t.providerAccountId),
}));

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::TEXT`),
    sessionToken: text('session_token').notNull().unique(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
}));

export const emailVerificationCodes = pgTable('email_verification_codes', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::TEXT`),
    email: text('email').notNull(),
    code: text('code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userCredentials = pgTable('user_credentials', {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::TEXT`),
    userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const memberInvitations = pgTable('member_invitations', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('viewer'),
    token: text('token').notNull().unique(),
    invitedBy: text('invited_by').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    status: text('status').notNull().default('pending'), // pending, accepted, expired, revoked
}, (t) => ({
    unq: unique().on(t.projectId, t.email),
}));

export const jobs = pgTable('jobs', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    type: text('type').notNull(), // repo_scan, iac_generation, etc.
    status: text('status').notNull().default('pending'), // pending, processing, completed, failed
    payload: jsonb('payload').default({}),
    result: jsonb('result').default({}),
    error: text('error'),
    userId: text('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
