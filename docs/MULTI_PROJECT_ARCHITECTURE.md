# Multi-Project Architecture Plan

## Overview
Transform Sarge from single-user/single-project to multi-user/multi-project platform like Vercel.

## Current Problems
1. No project isolation - all deployments, logs, metrics mixed together
2. Settings are user-level, not project-level
3. No way to manage multiple repositories/projects per user
4. Environment variables not scoped to projects
5. Dashboard shows everything, not project-specific data

## Target Architecture (Vercel-like)

### Data Model Hierarchy
```
User (Account)
  └─ Projects (1-to-many)
      ├─ Repository Link (GitHub repo)
      ├─ Deployments (history)
      ├─ Environment Variables (dev/preview/prod)
      ├─ Logs (application logs)
      ├─ Metrics (performance data)
      ├─ Domains (custom domains)
      ├─ Settings (build config, functions, etc)
      └─ Members (future: team collaboration)
```

### Database Schema Changes

#### New Tables

**projects**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier
    description TEXT,
    framework VARCHAR(50), -- next.js, react, vue, etc
    repository_id INTEGER REFERENCES repositories(id),
    root_directory VARCHAR(255) DEFAULT './', -- monorepo support
    
    -- Build settings
    build_command TEXT DEFAULT 'npm run build',
    output_directory TEXT DEFAULT '.next',
    install_command TEXT DEFAULT 'npm install',
    dev_command TEXT DEFAULT 'npm run dev',
    
    -- Deployment settings
    auto_deploy BOOLEAN DEFAULT true,
    auto_deploy_branch VARCHAR(255) DEFAULT 'main',
    preview_deployments BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    last_deployed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, slug)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
```

**project_settings**
```sql
CREATE TABLE project_settings (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Function settings
    function_region VARCHAR(50) DEFAULT 'us-east-1',
    function_memory INTEGER DEFAULT 1024, -- MB
    function_timeout INTEGER DEFAULT 10, -- seconds
    
    -- Performance settings
    enable_edge BOOLEAN DEFAULT false,
    enable_analytics BOOLEAN DEFAULT true,
    enable_speed_insights BOOLEAN DEFAULT true,
    
    -- Security settings
    enable_waf BOOLEAN DEFAULT false,
    password_protection BOOLEAN DEFAULT false,
    password_hash TEXT,
    
    -- Advanced settings
    node_version VARCHAR(20) DEFAULT '18.x',
    custom_headers JSONB DEFAULT '[]',
    redirects JSONB DEFAULT '[]',
    rewrites JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);
```

**project_domains**
```sql
CREATE TABLE project_domains (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT false,
    dns_provider VARCHAR(50),
    ssl_enabled BOOLEAN DEFAULT true,
    ssl_certificate TEXT,
    redirect_to VARCHAR(255), -- for www -> non-www redirects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_domains_project_id ON project_domains(project_id);
```

#### Modified Tables

**environment_variables**
```sql
-- Change from user_id to project_id
ALTER TABLE environment_variables 
    DROP COLUMN user_id,
    ADD COLUMN project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_environment_variables_project_id ON environment_variables(project_id);
```

**deployments**
```sql
-- Add project_id reference
ALTER TABLE deployments 
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_deployments_project_id ON deployments(project_id);
```

**logs**
```sql
-- Add project_id for isolation
ALTER TABLE logs 
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_logs_project_id ON logs(project_id);
```

**metrics**
```sql
-- Add project_id for isolation
ALTER TABLE metrics 
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_metrics_project_id ON metrics(project_id);
```

**services**
```sql
-- Link services to projects
ALTER TABLE services 
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX idx_services_project_id ON services(project_id);
```

**repositories**
```sql
-- Keep repositories table but link through projects
-- One repo can be used by multiple projects (different branches/subdirs)
-- No changes needed to repositories table itself
```

### Frontend Architecture

#### Route Structure

**Account-Level Routes** (global settings)
```
/profile                    - User profile (name, email, avatar)
/settings/account           - Account settings
  /security                 - Password, 2FA, sessions
  /notifications            - Email preferences, alerts
  /integrations             - GitHub, Slack, webhooks
  /billing                  - Payment, usage, invoices
```

**Project-Level Routes** (per-project)
```
/                           - Dashboard (current project overview)
/projects                   - All projects list
/projects/new               - Create new project wizard
/projects/[id]              - Project dashboard
/projects/[id]/deployments  - Project deployments
/projects/[id]/logs         - Project logs
/projects/[id]/metrics      - Project metrics & analytics
/projects/[id]/settings     - Project settings
  /general                  - Name, framework, description
  /build-deploy             - Build commands, output dir
  /environment-variables    - Env vars (dev/preview/prod)
  /domains                  - Custom domains, SSL
  /git                      - Repository, branches, auto-deploy
  /functions                - Serverless function config
  /advanced                 - Node version, redirects, delete
```

#### Component Architecture

**1. Project Context Provider**
```tsx
// lib/project-context.tsx
interface ProjectContext {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

// Store selected project in localStorage
// Auto-select if only one project
// Provide project switcher in navbar
```

**2. Project Switcher Component**
```tsx
// components/project-switcher.tsx
// Dropdown in navbar (top-left like Vercel)
// Shows: project name, framework icon, last deployed
// Search/filter for many projects
// "Create New Project" button at bottom
```

**3. Project Settings Navigation**
```tsx
// components/project-settings/tabs-navigation.tsx
// Vertical sidebar with icons + labels
// Tabs: General, Build & Deploy, Environment Variables, 
//       Domains, Git, Functions, Advanced
// Active state styling
```

**4. Environment Variables Manager**
```tsx
// components/project-settings/environment-variables-tab.tsx
// Table view: key | value | environments
// Inline editing with save state
// Encrypted values (show/hide toggle)
// Bulk actions: import from .env, export, delete selected
// Environment toggle: Development, Preview, Production
// Validation: no spaces in keys, prevent conflicts
```

**5. Projects Overview**
```tsx
// app/projects/page.tsx
// Grid of project cards
// Each card shows:
//   - Project name + description
//   - Framework badge
//   - Last deployment status + time
//   - Quick stats (deploys this month, uptime %)
//   - View/Settings buttons
// Import from GitHub button (opens connect-repo-modal)
// Search and filter controls
```

### API Changes

#### tRPC Router Updates

**New Project Router**
```typescript
// backend/src/api/routers/project.ts
export const projectRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all projects for current user
    }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get project details + stats
    }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      repositoryId: z.number().optional(),
      framework: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create new project + default settings
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        // ... other fields
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // Update project
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Delete project (cascade deletes all related data)
    }),
  
  getSettings: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get project settings
    }),
  
  updateSettings: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      settings: z.object({
        // ... all settings fields
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // Update project settings
    }),
});
```

**Update Existing Routers**
```typescript
// All existing routers need project_id parameter:
// - deploymentRouter (filter by project)
// - logsRouter (filter by project)
// - metricsRouter (filter by project)
// - environmentVariablesRouter (CRUD per project)
```

### Migration Strategy

#### Phase 1: Database Migration (Breaking Change)
1. Create migration SQL script: `scripts/migrate-to-projects.sql`
2. Create `projects` table
3. Create default project for each existing user
4. Link all existing deployments/logs/metrics to default project
5. Add project_id columns to all related tables
6. Update all foreign keys

#### Phase 2: Backend API (Backwards Compatible)
1. Create project router and procedures
2. Update existing routers to accept optional project_id
3. Add project context middleware
4. Update database queries to join on project_id

#### Phase 3: Frontend Components (Incremental)
1. Create ProjectProvider and ProjectSwitcher
2. Update navbar with project dropdown
3. Create /projects overview page
4. Add project context to all pages

#### Phase 4: Settings Reorganization (Breaking Change)
1. Split settings into Account vs Project
2. Move general-tab to /projects/[id]/settings/general
3. Create environment-variables-tab
4. Create build-deploy-tab
5. Update all settings routes

#### Phase 5: Testing & Deployment
1. Test multi-project creation
2. Test project isolation (no data leakage)
3. Test switching between projects
4. Test deployment per project
5. Test environment variables per project
6. Full end-to-end testing

### User Experience Flow

#### First Time User
1. Sign up → Email verification
2. Connect GitHub repository → Creates first project automatically
3. Configure build settings (detected from repo)
4. Deploy → Success
5. Dashboard shows project overview

#### Existing User Adding Project
1. Click project switcher → "Create New Project"
2. Choose: Import from GitHub OR Manual setup
3. If GitHub: Select repo → Detect framework → Auto-configure
4. If Manual: Enter name → Choose framework → Configure manually
5. Project created → Redirected to project settings
6. Deploy when ready

#### Power User with Multiple Projects
1. Quick project switch via navbar dropdown
2. Search projects by name
3. Each project has isolated:
   - Deployments
   - Logs
   - Metrics
   - Environment variables
   - Settings
4. Can compare projects side-by-side
5. Bulk operations on projects (archive, delete)

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Projects table and data model
2. ✅ Project context and switcher
3. ✅ Projects overview page
4. ✅ Environment variables per project
5. ✅ Project-scoped deployments/logs/metrics

### Medium Priority (UX Enhancement)
6. Project settings pages (general, build, git)
7. Domain management
8. Function configuration
9. Project creation wizard

### Low Priority (Advanced Features)
10. Project members/team collaboration
11. Project analytics and insights
12. Project templates
13. One-click deploy from templates
14. Monorepo support (multiple projects per repo)

## Success Metrics
- User can create multiple projects ✓
- Each project has isolated data ✓
- No data leakage between projects ✓
- Can deploy different repos/branches as separate projects ✓
- Environment variables scoped per project ✓
- Settings are project-specific ✓
- Dashboard shows current project only ✓
- Project switching is seamless (<500ms) ✓

## Technical Debt to Address
- Update all API routes to require/validate project_id
- Add project_id to all database queries
- Implement proper authorization (user can only access their projects)
- Add project quotas (max projects per user)
- Implement soft delete for projects (recovery within 7 days)
- Add project activity logs (audit trail)

---

**Next Steps:**
1. Review this plan with stakeholders
2. Create migration script: `scripts/migrate-to-projects.sql`
3. Update schema: `scripts/create-complete-schema.sql`
4. Start with Phase 1 (Database Migration)
5. Implement Project Context Provider
6. Build Projects Overview page
7. Create Environment Variables manager
8. Test end-to-end workflow
