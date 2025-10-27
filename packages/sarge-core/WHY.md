# WHY

Defines a single domain language (Workspace, Stack, Service, Resource, Telemetry, Snapshot) with explicit lifecycle and events. This enables offline-first, deterministic orchestration and clean tRPC surfaces across the app.

## Why One-Click Sits at the Heart of Sarge

**One-Click Deploy** is the primary entrypoint for new users and the fastest path from "repo on disk" to "running, observable stack." It embodies Sarge's core philosophy:

1. **Offline-first**: No cloud credentials, no SaaS dashboards, no external dependencies. Detection, planning, and execution happen entirely on your machine. Your data never leaves localhost.

2. **Reproducibility**: Every run is deterministic. The same blueprint + plan always yields the same local infrastructure state. Snapshots let you freeze and replay any moment in time—perfect for debugging, demos, or rolling back failed experiments.

3. **Observability by default**: Every service emits structured logs (JSON lines) and Prometheus metrics from the start. Dashboards, alerts, and retention policies are seeded automatically. You see what's happening without bolting on instrumentation later.

4. **Plan before apply**: The wizard forces a review step. You see port assignments, env validation, resource operations, and conflicts *before* any process starts. No surprises, no hidden state mutations.

5. **Developer UX**: Three linear steps (Detect → Plan → Observe) map cleanly to the mental model developers already use: "What do I have?" → "What will change?" → "Is it working?" The UI surfaces actionable hints on failures (missing env, port conflicts) so you fix issues immediately instead of digging through logs.

By centering One-Click in the UX, Sarge makes local-first cloud development feel as simple as `npm start`—but with production-grade telemetry, snapshots, and infra-as-code rigor baked in from day one.

