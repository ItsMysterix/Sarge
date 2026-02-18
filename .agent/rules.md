# Agent Rules & Constraints

## Mocking Policy
- **NO MOCK DATA**: Never use mock data (e.g., `Math.random()`, hardcoded lists of resources, simulated delays) unless explicitly requested for a temporary demo.
- **SURFACE REALITY**: If data is missing from the backend/database, show the empty state or an error. It is better to have a "broken" UI that prompts the user to fix their configuration than a "fake complete" UI that hides real issues.
- **DATA-DRIVEN UI**: Components must be driven by actual API responses (tRPC, REST, etc.). If a field is null, display "--" or leave it blank.

## Design Alignment
- **PRISTINE UI**: Maintain professional, high-fidelity designs using established design systems (Tailwind, Shadcn). Avoid "experimental" or "neural" aesthetics unless specifically asked.
- **CONSISTENCY**: Respect the existing typography, spacing, and component patterns of the codebase.

## Layout Persistence
- **REFINE, DON'T OVERSTUFF**: When the user asks for a layout change, focus strictly on the requested columns/sections. Remove redundant sections proactively if they contradict the new objective.
