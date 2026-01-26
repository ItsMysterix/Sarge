# Development Guide

Instructions for developers working on Sarge locally.

## Prerequisites

- **Node.js** 18+ (use `nvm` or `fnm` for version management)
- **pnpm** 8+ (or npm 9+)
- **PostgreSQL** 14+ (local or Neon cloud)
- **Git** (GitHub CLI optional)
- **VS Code** (recommended; includes ESLint, Prettier)

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ItsMysterix/Sarge.git
cd Sarge
```

### 2. Install Dependencies
```bash
pnpm install
# or npm install
```

### 3. Create Environment File
```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables

**Minimum for local dev:**
```env
# Database (without this, APIs gracefully return mock data)
DATABASE_URL=postgresql://localhost:5432/sarge

# Authentication (required to access the app)
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# WebSocket (only needed if backend runs on different port)
NEXT_PUBLIC_WS_URL=ws://localhost:3200

# Rate limiting (optional)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_SEC=60
```

**Optional for advanced features:**
```env
# AI Co-Pilot features
ANTHROPIC_API_KEY=sk-...
ENABLE_AI_ANALYSIS=true

# Prometheus metrics (set a token to protect endpoint)
PROM_METRICS_TOKEN=dev-token-123

# OAuth (GitHub, Google)
GITHUB_ID=your-github-oauth-id
GITHUB_SECRET=your-github-oauth-secret
```

### 5. Set Up Database

If you're using a local PostgreSQL instance:

```bash
# Start PostgreSQL (if not running)
brew services start postgresql  # macOS
# or pg_ctl -D /usr/local/var/postgres start

# Create database
createdb sarge

# Run migrations (if any exist in backend/src/db)
psql sarge < backend/src/db/schema.sql
```

If using Neon (cloud):
1. Create account at https://neon.tech
2. Create a new project
3. Copy connection string → set as `DATABASE_URL` in `.env.local`

## Running Locally

### Both Frontend & Backend Together
```bash
npm run dev
```

This runs:
- **Next.js** on http://localhost:3000
- **tRPC WS** on http://localhost:3200

### Frontend Only
```bash
npm run dev:frontend
# or
cd app && npm run dev
```

Runs on http://localhost:3000. Backend will be unreachable unless running separately.

### Backend Only
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

Runs tRPC WebSocket server on http://localhost:3200.

## Architecture & Code Layout

### Frontend (Next.js 14)
```
app/
├── page.tsx                      # Dashboard
├── api/                          # Serverless routes
│   ├── auth/[...nextauth]/      # OAuth handlers
│   ├── metrics                   # Prometheus endpoint
│   ├── deployments/route.ts      # Deployment CRUD
│   └── ...
├── deployments/                  # Deployment pages
├── logs/                         # Log viewer
├── metrics/                      # Metrics dashboard
├── projects/                     # Project management
├── settings/                     # User settings
├── sign-in/ & sign-up/          # Auth pages
└── layout.tsx                    # Root layout + providers

components/
├── dashboard/                    # Dashboard widgets
├── deploy/                       # Deploy components
├── logs/                         # Log viewer components
├── metrics/                      # Metrics components
├── settings/                     # Settings tabs
├── ui/                          # Reusable UI (buttons, cards, etc.)
└── layout/                      # Layout components (sidebar, nav)

lib/
├── trpc.ts                      # tRPC client setup
├── trpc-provider.tsx            # tRPC + superjson provider
├── store.ts                     # Zustand global state
├── db.ts                        # Database utilities
├── utils.ts                     # Helper functions
└── types.ts                     # Shared TypeScript types

middleware.ts                     # Route protection (Auth.js)
```

### Backend (Node.js + tRPC)
```
backend/src/
├── api/
│   ├── root.ts                  # Main router (exports all routers)
│   ├── ws-server.ts             # WebSocket server (Node.js http + ws)
│   ├── routers/
│   │   ├── deploy.ts            # Deployment CRUD + subscription
│   │   ├── logs.ts              # Log queries + streaming
│   │   ├── metrics.ts           # Prometheus queries
│   │   ├── projects.ts          # Project CRUD
│   │   ├── services.ts          # Service discovery
│   │   ├── oneclick.ts          # One-click deploy wizard
│   │   ├── stacks.ts            # Workspace management
│   │   └── sarge.ts             # Health, alerts, snapshots
│   ├── lib/
│   │   ├── trpc.ts              # tRPC server config + superjson
│   │   ├── db.ts                # Neon pooled client
│   │   ├── realtime.ts          # Buffered subscription helper
│   │   ├── logger.ts            # Logging utility
│   │   └── providers/           # Cloud provider integrations
│   └── trpc/
│       └── middlewares/
│           ├── security.ts      # RBAC + license checks
│           └── rate-limit.ts    # Rate limiting
├── db/
│   └── schema.sql               # Database schema migrations
└── test/                        # Test files
```

## Common Tasks

### Adding a New Backend Router

1. Create `backend/src/api/routers/myrouter.ts`:
```typescript
import { router, secureProcedure } from '../trpc'
import { z } from 'zod'

export const myRouter = router({
  list: secureProcedure('myrouter.list')
    .query(async () => {
      // SELECT * FROM my_table
      return []
    }),

  create: secureProcedure('myrouter.create', { requiresRole: 'operator' })
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      // INSERT INTO my_table (name) VALUES (input.name)
      return { id: '123', name: input.name }
    }),

  subscribe: secureProcedure('myrouter.subscribe')
    .subscription(async () => {
      // Return observable of events
      // ctx.ee.emit('mytopic', { data })
    }),
})
```

2. Export from `backend/src/api/root.ts`:
```typescript
import { myRouter } from './routers/myrouter'

export const appRouter = router({
  myrouter: myRouter,
  // ... other routers
})
```

3. Use in frontend:
```typescript
import { trpc } from '@/lib/trpc'

function MyComponent() {
  const { data } = trpc.myrouter.list.useQuery()
  
  const createMutation = trpc.myrouter.create.useMutation()
  
  return (
    <div>
      {data?.map(item => <div key={item.id}>{item.name}</div>)}
      <button onClick={() => createMutation.mutate({ name: 'New' })}>
        Create
      </button>
    </div>
  )
}
```

### Adding a New Frontend Page

1. Create `app/mypage/page.tsx`:
```typescript
'use client'

import { trpc } from '@/lib/trpc'

export default function MyPage() {
  const { data, isLoading } = trpc.myrouter.list.useQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

2. Add to `middleware.ts` if it should be protected:
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/mypage',  // Protect /mypage
    // ... other protected routes
  ],
}
```

### Running Tests

**Backend unit tests:**
```bash
cd backend
npm test
# or with watch mode
npm test -- --watch
```

**Frontend unit tests:**
```bash
npm run test
```

**E2E tests:**
```bash
npm run test:e2e
```

## Debugging

### Backend Debugging
```bash
# Start with Node inspector
node --inspect backend/src/api/ws-server.ts

# Then open: chrome://inspect
# Or use VS Code debugger (launch config included)
```

### Frontend Debugging
- Open browser DevTools (F12)
- React DevTools browser extension recommended
- tRPC DevTools (beta) for inspecting WS messages

### Logs
- **Frontend**: Browser console
- **Backend**: stdout (JSON structured logs)
- **Database**: Enable postgres logs in `.env.local`

### Checking DB Connection
```bash
# Test connection to Neon
psql "$DATABASE_URL"

# Or from Node
node -e "
const { sql } = require('@neondatabase/serverless')
const db = sql(process.env.DATABASE_URL)
db\`SELECT 1\`.then(r => console.log('✅ Connected', r))
"
```

## Code Style & Linting

We use:
- **ESLint**: Enforced in CI
- **Prettier**: Auto-format with `npm run format`
- **TypeScript**: Strict mode enabled

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run type-check
```

## Git Workflow

1. **Create a feature branch**:
```bash
git checkout -b feature/my-feature
```

2. **Make changes & commit**:
```bash
git add .
git commit -m "feat: add my feature"
# or use commitizen: npm run commit
```

3. **Push & create PR**:
```bash
git push origin feature/my-feature
# Then open GitHub PR
```

4. **CI checks**:
- Linting (ESLint)
- Type checking (TypeScript)
- Tests (unit + E2E)
- Security scanning (Snyk)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for PR guidelines.

## Environment Details

### Neon Postgres
If using Neon, get connection pooled endpoint (faster):
1. Neon Dashboard → Project → Branches
2. Click "Show credentials"
3. Copy "Pooled connection string"
4. Paste as `DATABASE_URL` in `.env.local`

Connection pooling is transparent; no code changes needed.

### Authentication (Auth.js)

Sarge uses Auth.js (NextAuth.js v5) with:
- **Providers**: GitHub, Google (or email/password)
- **Session storage**: Database-backed
- **Cookies**: Secure, httpOnly, SameSite=Lax

To set up OAuth:
1. Create GitHub OAuth app: https://github.com/settings/developers
2. Set `GITHUB_ID` + `GITHUB_SECRET` in `.env.local`
3. Restart server

### WebSocket Communication

Frontend ↔ Backend over WebSocket using tRPC:
```typescript
// Frontend
const { data } = trpc.metrics.live.useSubscription()

// Backend
subscribe: secureProcedure('metrics.live').subscription(() => {
  return observable(emit => {
    // Emit events
    ctx.ee.on('metrics:new', data => emit.next(data))
  })
})
```

Subscriptions are buffered (50-500 events) to prevent client overload.

## Troubleshooting

### "Cannot find module @trpc/server"
```bash
# Install backend dependencies
cd backend && npm install
```

### "DATABASE_URL is undefined"
```bash
# Ensure .env.local exists & DATABASE_URL is set
cat .env.local | grep DATABASE_URL
# If missing, APIs will return mock data (graceful degradation)
```

### WebSocket connection fails
```bash
# Check backend is running on port 3200
lsof -i :3200
# If not, run: npm run dev:backend in another terminal
```

### "Permission denied" on migrations
```bash
# Ensure DB user has CREATE/ALTER permissions
psql "$DATABASE_URL" -c "GRANT ALL PRIVILEGES ON DATABASE sarge TO current_user;"
```

### Types not updating in frontend
```bash
# Ensure backend/src/api/root.ts is at expected path
# (If moved/renamed, update import in lib/trpc.ts)
# Then restart TypeScript server in VS Code
```

## Performance Tips

- **Hot reload**: Both frontend & backend support hot reloading
- **Database**: Use connection pooling (enabled by default with Neon)
- **Frontend**: Use `React.memo` for expensive components
- **Backend**: Avoid blocking operations; use async/await

## Next Steps

- Read [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) for deep dive
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for PR process
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
