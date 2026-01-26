# Page Deduplication & Cleanup Summary

## Removed Duplicate/Alias Pages (7 directories)

### Alias Redirects (Removed - Canonical URLs now used)
1. **`/app/launch`** → Was re-exporting `/oneclick`
   - **Keep**: `/oneclick` (One-click Deploy wizard)
   - **Rationale**: Canonical source for launch/deploy flow

2. **`/app/templates`** → Was re-exporting `/stacks`
   - **Keep**: `/stacks` (Stack composition & templates)
   - **Rationale**: Canonical source for template management

3. **`/app/pipelines`** → Was re-exporting `/deployments`
   - **Keep**: `/deployments` (Deployment history & management)
   - **Rationale**: Canonical source for pipeline/deployment tracking

4. **`/app/sandbox`** → Was re-exporting `/aws`
   - **Keep**: `/aws` (AWS Emulation/Local Cloud)
   - **Rationale**: Canonical source for local infrastructure emulation

### Legacy/Utility Pages (Removed - No longer needed)
5. **`/app/test-deploy`** (97 lines)
   - **Purpose**: Development-only test deployment form
   - **Status**: Replaced by integrated `/oneclick` + tRPC deploy mutations
   - **Rationale**: Functionality now available in main Launch flow

6. **`/app/workspaces`** (155 lines)
   - **Purpose**: Legacy workspace listing from GitHub
   - **Status**: Replaced by project-based organization
   - **Rationale**: Not aligned with new multi-provider multi-project IA

7. **`/app/aws/detection`** (directory)
   - **Purpose**: AWS resource detection subpage
   - **Status**: Functionality integrated into `/aws` main page
   - **Rationale**: Detection now part of main AWS emulation view

---

## Sidebar Navigation Updated

**Before** (8 items with aliases):
```
- Workspace → /
- Launch → /launch
- Templates → /templates
- Targets → /targets
- Observability → /observability
- Pipelines → /pipelines
- Sandbox → /sandbox
- Settings → /settings
```

**After** (8 items with canonical paths):
```
- Workspace → /
- Launch → /oneclick  ✓ Direct to canonical
- Templates → /stacks  ✓ Direct to canonical
- Targets → /targets
- Observability → /observability
- Pipelines → /deployments  ✓ Direct to canonical
- Sandbox → /aws  ✓ Direct to canonical
- Settings → /settings
```

---

## Canonical Page Structure (18 total)

### Core Navigation Pages
- `/` — Workspace overview
- `/oneclick` — Launch wizard with provider selection
- `/stacks` — Template composition
- `/targets` — Provider connections
- `/deployments` — Pipeline/deployment history
- `/aws` — Local cloud emulation
- `/observability` — Metrics + logs hub
- `/settings` — Workspace config

### Detailed Views
- `/deployments/[id]` — Deployment detail page
- `/metrics` — Metrics dashboard
- `/logs` — Live logs viewer
- `/services` — Service monitoring
- `/projects` — Project selector
- `/profile` — User profile

### Other
- `/landing` — Landing page (unauthenticated)
- `/sign-in`, `/sign-up` — Auth pages
- `/explain` — Stack explanation (AI-free)

---

## File Cleanup Summary
- **Directories removed**: 7 (launch, templates, pipelines, sandbox, test-deploy, workspaces, aws/detection)
- **Lines of code removed**: ~750 lines of duplicated/legacy code
- **Routes consolidated**: 4 alias routes eliminated
- **No functionality lost**: All features preserved in canonical pages
- **Documentation updated**: [qovery-migration-sprints.md](../qovery-migration-sprints.md)

