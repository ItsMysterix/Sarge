# Detector: Why and tradeoffs

This detector provides a fast, offline-first scan that turns an arbitrary repo into a Stack Blueprint.

Principles:
- Deterministic: no network calls, bounded filesystem walks, stable heuristics.
- Fast: small repos complete in <2s on Apple M-series by limiting scanned files and skipping bulky dirs.
- Conservative: prefer under-detecting over false positives; expose `overrides` to refine results.

Tradeoffs and handling:
- Ports: inferred from scripts like `start`/`dev` by matching `-p/--port` or `PORT=…`. If ambiguous, we default (Next/Express -> 3000).
- Resources: we don’t build ASTs; we look for AWS SDK v3 client imports and common command shapes to hint bucket/table names.
- Services: Next -> `web`, Express -> `api`, otherwise fallback to a single `worker` if a start/dev script exists.
- Docker: presence only (Dockerfile/compose files), we don’t parse their internals in the first pass.

Extensibility:
- Add lightweight language detectors (Python, Go) by scanning manifest files (requirements.txt, poetry.lock, go.mod) and framework hints.
- Allow plugins to provide repo-specific detection enrichers.

Limiters for determinism:
- Ignore heavy dirs: `node_modules`, `.git`, `.next`, `dist`, `build`.
- Cap scanned files (default 500; configurable via `maxFiles`).

Acceptance:
- Deterministic tests with fixtures.
- No network; completes quickly on a cold run.
- Output validated by Zod (`StackBlueprintSchema`).