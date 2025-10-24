## Sarge — Copilot / AI agent quick instructions

Purpose: give an AI coding agent the minimal, concrete context needed to be productive in this repo.

- Big picture
  - Next.js 14 frontend lives under `app/` (App Router). UI uses Tailwind + Clerk for auth.
  - A small TypeScript backend lives under `backend/` exposing a tRPC router served over WebSockets (see `backend/src/api/ws-server.ts`).
  - Frontend uses a tRPC client over WebSockets to `ws://localhost:3200` (see `lib/trpc-provider.tsx`).
  - The repo includes k8s manifests/kustomize under `bridge/` (base + overlays) for optional deployments.

- Developer workflows (concrete commands & expectations)
  - Local dev: from the repo root run the script in `package.json`: `npm run dev` (it runs both `next dev` and the tRPC WS server concurrently). You may also run them separately:
    - Frontend: `npm run dev:frontend` (or `next dev`) in the repo root.
    - Backend WS server: `npm run dev:backend` or `node backend/src/api/ws-server.ts` / `ts-node backend/src/api/ws-server.ts` (see `backend/package.json`).
  - Build: `npm run build` runs `next build` for the frontend. Backend `build` is `tsc` inside `backend/`.
  - Notes: a `pnpm-lock.yaml` exists — team may use `pnpm` instead of `npm`. Scripts are standard npm scripts, so both package managers work but prefer the project's chosen lockfile.

- Key integration points and conventions
  - tRPC over WebSocket: the frontend imports trpc types from `../backend/src/api/root` (see `lib/trpc.ts`). When adding new backend routers, register them in `backend/src/api/root.ts` so client types pick them up.
  - WebSocket server port: `3200` (hard-coded in `backend/src/api/ws-server.ts` and client in `lib/trpc-provider.tsx`). Keep these in sync when changing.
  - Serverless route handlers: `app/api/*` are Next.js server actions/route handlers. Many endpoints use `@neondatabase/serverless` (Neon) with `process.env.DATABASE_URL`. They include defensive fallbacks (mock data) when DB tables are missing — expect and respect those patterns when changing endpoints.
  - Auth: Clerk is used (see `middleware.ts`, `app/layout.tsx`, and `components/debug/auth-debug.tsx`). `middleware.ts` protects routes using the matcher; changing route protection should update this file.
  - Serialization: tRPC uses `superjson` on both server (`backend/src/api/lib/trpc.ts`) and client (`lib/trpc-provider.tsx`) — preserve that transformer across client/server changes.

- Project-specific patterns to follow
  - Mock-first/resilient endpoints: several `app/api/*` endpoints return mock data on DB errors (see `app/api/deployments/route.ts` and `app/api/deploy/route.ts`). When adding features, include similar fallbacks for developer UX.
  - Keep type imports simple: the React client imports `AppRouter` directly from `../backend/src/api/root` (not from a published package). Avoid moving or renaming that file without updating import paths.
  - UI debug helpers are intentionally gated to development via `process.env.NODE_ENV !== "development"` (see `components/debug/auth-debug.tsx`). Follow that pattern when adding dev-only UI.

- Files to inspect when working on a change
  - Frontend entry & providers: `app/layout.tsx`, `lib/trpc-provider.tsx`, `lib/trpc.ts`.
  - Backend routers & server: `backend/src/api/root.ts`, `backend/src/api/ws-server.ts`, `backend/src/api/routers/*`, `backend/src/api/lib/trpc.ts`.
  - Serverless endpoints: `app/api/*` for endpoints that interact with Neon or simulate infra operations.
  - K8s/deploy: `bridge/base/kustomization.yaml` and `bridge/overlays/*`.
  - Sample data + seeds: `data/*.json` and `scripts/*.sql`.

- Quick rules for the AI agent (do this when making changes)
  - When adding a new backend router, export it from `backend/src/api/root.ts` and restart the WS server. Update the frontend `trpc` client only if you change the transport or transformer.
  - Preserve WebSocket port 3200 or change both client (`lib/trpc-provider.tsx`) and server (`backend/src/api/ws-server.ts`).
  - Keep `superjson` on both sides to avoid serialization issues with dates/complex types.
  - Respect mock-data fallbacks in `app/api/*` — keep semantics: try DB, on error return reasonable mock object and log error.
  - Do not remove `middleware.ts` protections without reviewing route matcher implications (it intentionally protects most routes and APIs).

- Where the repo commonly breaks / gotchas
  - If the frontend UI shows missing data, make sure the WS server (port 3200) is running; several pages depend on live tRPC subscriptions.
  - DB calls use Neon serverless; if `DATABASE_URL` is missing or the migrations/tables aren't present, endpoints intentionally return mock data.
  - Watch for cross-folder TypeScript imports (`lib/trpc.ts` imports backend types with a relative path) — moving files will break types.

If something above is unclear or you'd like more detail (example runs, list of environment variables, or auto-generated type stubs), tell me which part to expand and I'll iterate.
